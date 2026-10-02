/* The loop.

   A month runs: wages arrive, the player faces one beat, greed is rolled for,
   and then the month closes with interest and a payment. The beat sits between
   the wages and the close on purpose — whatever a scenario hands you is still
   in your pocket while you decide, and gone by the time the month is over. */
(function (global) {
  'use strict';

  var state = null;
  var rng = null;

  function begin(seed) {
    state = global.State.create(typeof seed === 'number' ? seed : global.Rng.randomSeed());
    rng = global.Rng.create(state.seed);
    global.State.save(state);
    nextMonth();
  }

  function resume(saved) {
    state = saved;
    /* The generator is re-seeded from the top on resume, so a reloaded run is
       not the same sequence of rolls it would have been. Replaying a month to
       get a different bet result is exactly the habit this game is about, and
       the save is a convenience, not a second chance. */
    rng = global.Rng.create(state.seed + state.month);
    nextMonth();
  }

  function refresh() {
    global.Ui.renderLedger(state);
    global.Ui.applyMurk(state);
  }

  function showIntro() {
    var intro = global.SCRIPT.intro;
    global.Ui.showLedgerBar(false);
    global.Ui.renderCard({
      modifier: 'card--intro',
      art: intro.art,
      artLabel: intro.alt,
      title: intro.title,
      body: intro.body,
      button: intro.button,
      onContinue: function () {
        global.Ui.showLedgerBar(true);
        begin();
      }
    });
  }

  function nextMonth() {
    if (state.ended) return showEnding(state.ended);

    global.Economy.openMonth(state);
    var beat = global.Scenarios.beatFor(state.month);

    /* Out of authored months: either the run reached its end or the build has
       not been written that far yet. Both finish the same way. */
    if (!beat) return finish();

    refresh();
    showBeat(beat);
  }

  function showBeat(beat) {
    var chapter = global.Scenarios.chapterFor(beat);
    var date = global.Economy.dateFor(state.month - 1);
    var choices = global.Scenarios.visibleChoices(state, beat);

    global.Ui.renderCard({
      kicker: chapter.title + ' · ' + date.month + ' ' + String(date.year),
      title: beat.title,
      body: beat.body,
      note: beat.note,
      choices: choices,
      onChoose: function (choice) {
        var result = global.Scenarios.choose(state, beat, choice, rng);
        refresh();
        showResolution(beat, result);
      }
    });
  }

  function showResolution(beat, result) {
    var body = [result.outcome];
    var extra = null;

    if (result.wager) {
      extra = wagerReceipt(result.wager);
    }

    /* The bill for greed, if it arrives this month. Rolled after the choice so
       a collection can never be blamed on the thing the player just did — it
       is always the interest on something older. */
    var collection = global.Scenarios.collectionRoll(state, rng);

    if (collection) {
      body.push(collection.body);
      refresh();
    }

    global.Ui.renderCard({
      image: result.image,
      imageAlt: result.imageAlt,
      kicker: collection ? collection.title : null,
      body: body,
      extra: extra,
      button: 'Continue',
      onContinue: closeOrCrisis
    });
  }

  function wagerReceipt(wager) {
    var box = global.Ui.el('div', 'receipt' + (wager.won ? ' receipt--win' : ' receipt--loss'));

    function row(label, value) {
      var line = global.Ui.el('div', 'receipt__row');
      var key = global.Ui.el('span', 'receipt__label');
      key.appendChild(document.createTextNode(label));
      var val = global.Ui.el('span', 'receipt__value');
      val.appendChild(document.createTextNode(value));
      line.appendChild(key);
      line.appendChild(val);
      box.appendChild(line);
    }

    row('Staked', global.Economy.money(wager.stake));
    row('Returned', global.Economy.money(wager.payout));
    /* The true odds are printed on every single bet, win or lose. The game's
       claim about gambling is only honest if the player can check it. */
    row('Chance of that', String(Math.round(wager.chance * 100)) + '%');
    return box;
  }

  /* Either the month closes quietly, or it cannot. */
  function closeOrCrisis() {
    if (global.Economy.willFallShort(state)) return showCrisis();
    closeMonth('pay');
  }

  function showCrisis() {
    var crisis = global.SCRIPT.system.crisis;

    global.Ui.renderCard({
      kicker: 'Short by ' + global.Economy.money(global.Economy.shortfall(state)),
      title: crisis.title,
      body: crisis.body,
      choices: crisis.choices,
      onChoose: function (choice) {
        closeMonth(choice.id === 'crisis-borrow' ? 'borrow' : 'miss', choice.outcome);
      }
    });
  }

  function closeMonth(mode, outcome) {
    var record = global.Economy.closeMonth(state, mode);
    global.State.save(state);
    refresh();

    var ruin = global.Endings.checkRuin(state);

    global.Ui.renderCard({
      body: outcome ? [outcome] : [],
      statement: global.Ui.statementStrip(record),
      button: ruin ? 'And that is that' : 'Next month',
      onContinue: ruin ? function () { finish(ruin); } : nextMonth
    });
  }

  function finish(forced) {
    var id = forced || global.Endings.resolve(state);
    state.ended = id;
    global.State.save(state);
    showEnding(id);
  }

  function showEnding(id) {
    /* The full set of endings arrives in step four. Until then any gate that
       fires lands on the interlude card rather than a blank screen. */
    var prose = global.Endings.prose(id) || global.Endings.prose('interlude');
    var data = global.Endings.ledger(state);

    global.Ui.showLedgerBar(false);
    global.Ui.renderCard({
      kicker: id === prose.id ? null : 'Gate reached: ' + id,
      title: prose.title,
      body: prose.body,
      extra: finalLedger(data),
      button: 'Start again',
      onContinue: function () {
        global.State.clear();
        showIntro();
      }
    });
  }

  function finalLedger(data) {
    var box = global.Ui.el('div', 'final');

    function row(label, value, modifier) {
      if (value === null || value === undefined) return;
      var line = global.Ui.el('div', 'final__row' + (modifier ? ' ' + modifier : ''));
      var key = global.Ui.el('span', 'final__label');
      key.appendChild(document.createTextNode(label));
      var val = global.Ui.el('span', 'final__value');
      val.appendChild(document.createTextNode(value));
      line.appendChild(key);
      line.appendChild(val);
      box.appendChild(line);
    }

    function heading(text) {
      var h = global.Ui.el('h3', 'final__heading');
      h.appendChild(document.createTextNode(text));
      box.appendChild(h);
    }

    heading('The balance');
    row('Months', String(data.months));
    row('Still owed', global.Economy.money(data.debt));
    row('Interest paid to Luca "The Undertaker"', global.Economy.money(data.interestPaid));
    row('Rate reached', String(data.rate) + '% / month');
    row('Payments missed', String(data.missedPayments));
    row('New loans taken', String(data.loansTaken));

    /* Silent for a player who never bet. Printing a row of zeroes at someone
       who refused every wager would read as an accusation. */
    if (data.wagers) {
      heading('What the betting did');
      row('Bets placed', String(data.wagers));
      row('Total staked', global.Economy.money(data.wagered));
      row('Total returned', global.Economy.money(data.returned));
      row(
        'You got back',
        String(Math.round(data.realised * 100)) + ' cents per euro',
        data.realised < 1 ? 'final__row--bad' : 'final__row--good'
      );
    }

    if (data.collections || data.exposure) {
      heading('What it cost to cut corners');
      row('Times it caught up', String(data.collections));
      row('Still exposed', String(Math.round(data.exposure)) + ' / 100');
    }

    heading('What you became');
    row('How honestly you see yourself', String(data.self) + ' / 10');
    row('People who still take your calls', String(data.standing) + ' / 10');
    row('Did you tell anyone the truth', data.disclosed ? 'Yes' : 'No');

    if (data.turningPoints.length) {
      heading('The months that decided it');
      data.turningPoints.forEach(function (entry) {
        var date = global.Economy.dateFor(entry.month - 1);
        row(date.month + ' ' + String(date.year), entry.label);
      });
    }

    row('Seed', global.Rng.format(data.seed), 'final__row--quiet');
    return box;
  }

  function boot() {
    global.Ui.init();

    document.getElementById('restart').addEventListener('click', function () {
      global.State.clear();
      showIntro();
    });

    var saved = global.State.load();

    if (saved && !saved.ended && saved.month > 0) {
      global.Ui.showLedgerBar(true);
      /* The save is written at the END of a month, in closeMonth, so a resumed
         run belongs at the start of the NEXT one — which is exactly what
         nextMonth does unaided.

         An earlier version rewound the counter here before resuming, on the
         theory that openMonth would otherwise skip a month. It does not, and
         the rewind replayed the month the player had just finished: its effects
         applied a second time, the wages never arrived so cash came back at the
         buffer instead of the buffer plus the surplus, and a choice costing more
         than that could still take its full value off the balance because
         State.apply floors cash at zero. Do not reintroduce it. */
      resume(saved);
      return;
    }

    showIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
