/* Picks the beat for the month, decides which choices the player is allowed to
   see, and applies what they picked.

   No prose lives in this file and no rule lives in content/script.js. That line
   is what makes the game rewritable: the whole script can be replaced without
   touching a rule, and the whole economy retuned without touching a word. */
(function (global) {
  'use strict';

  function script() {
    return global.SCRIPT;
  }

  function beatFor(month) {
    var beats = script().beats;
    var i;

    for (i = 0; i < beats.length; i += 1) {
      if (beats[i].month === month) return beats[i];
    }

    return null;
  }

  function chapterFor(beat) {
    var chapters = script().chapters;
    var i;

    for (i = 0; i < chapters.length; i += 1) {
      if (chapters[i].id === beat.chapter) return chapters[i];
    }

    return null;
  }

  /* Gating runs both ways. `requires` is the usual "you need to be together
     enough to see this"; `hiddenWhen` is the inverse, and it is the more
     interesting of the two — some options only occur to you once you are
     desperate, and the game should stop offering the clear-headed ones. */
  function visibleChoices(state, beat) {
    return beat.choices.filter(function (choice) {
      if (choice.requires && !global.State.meets(state, choice.requires)) return false;
      if (choice.hiddenWhen && global.State.meets(state, choice.hiddenWhen)) return false;
      return true;
    });
  }

  /* Applies a choice and reports what happened, so the UI can narrate it
     without knowing any of the rules. */
  function choose(state, beat, choice, rng) {
    var result = {
      outcome: choice.outcome,
      wager: null,
      greed: false,
      loan: false
    };

    if (choice.wager) {
      var stake = choice.wager.stake === 'suggested'
        ? global.Wager.suggestedStake(state, choice.wager.base || 100)
        : choice.wager.stake;

      result.wager = global.Wager.resolve(state, rng, {
        multiplier: choice.wager.multiplier,
        stake: stake,
        scripted: choice.wager.scripted
      });

      result.outcome = result.wager.won ? choice.outcomeWin : choice.outcomeLose;
    }

    global.State.apply(state, choice.effects);

    if (choice.wager && !result.wager.won && choice.effectsLose) {
      global.State.apply(state, choice.effectsLose);
    }

    (choice.flags || []).forEach(function (flag) {
      global.State.raise(state, flag);
    });

    if (choice.tags && choice.tags.indexOf('greed') !== -1) result.greed = true;

    if (choice.tags && choice.tags.indexOf('loan') !== -1) {
      state.loansTaken += 1;
      global.Economy.ratchet(state, 'newLoan');
      result.loan = true;
    }

    state.history.push({
      month: state.month,
      beat: beat.id,
      choice: choice.id,
      label: choice.label,
      weight: choice.weight || 0
    });

    return result;
  }

  /* The bill for greed. Exposure never costs anything at the moment it is
     earned — that is the point of it. It buys a rising monthly chance that
     someone notices, and the severity scales with how much of it you have
     accumulated, so the player who took one shortcut and the player who took
     six are in genuinely different trouble. */
  function collectionRoll(state, rng) {
    if (state.exposure <= 0) return null;
    if (rng() >= (state.exposure / 100) * global.GAME.greed.collectionChance) return null;

    var severity = state.exposure >= 60 ? 'severe' : state.exposure >= 30 ? 'serious' : 'minor';
    var events = script().system.collection[severity];
    var event = events[Math.floor(rng() * events.length)];

    global.State.apply(state, event.effects);
    state.collections += 1;
    /* Being caught once does not clear the record, but it does burn off some of
       what you were exposed for — otherwise a single bad month cascades into
       four more and the player reads it as the game holding a grudge. */
    state.exposure = Math.max(0, state.exposure - 25);

    return event;
  }

  /* The three choices that mattered most, for the ending screen. Content marks
     the pivotal options with a `weight`; everything else is scenery. */
  function turningPoints(state) {
    return state.history
      .filter(function (entry) { return entry.weight > 0; })
      .sort(function (a, b) { return b.weight - a.weight; })
      .slice(0, 3);
  }

  global.Scenarios = {
    beatFor: beatFor,
    chapterFor: chapterFor,
    visibleChoices: visibleChoices,
    choose: choose,
    collectionRoll: collectionRoll,
    turningPoints: turningPoints
  };
})(window);
