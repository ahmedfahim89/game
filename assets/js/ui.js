/* Rendering. Knows how to draw a card and a ledger; knows nothing about when
   to draw one. Every piece of authored text reaches the page through
   createTextNode, never through innerHTML — the prose is ours, but keeping the
   rule means a future editing tool cannot introduce an injection by accident. */
(function (global) {
  'use strict';

  var THEME_KEY = 'underwater-theme';

  var stage = null;
  var ledgerEl = null;

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  /* Authored prose marks emphasis with *asterisks*. Parsed into real <em>
     nodes rather than assembled as a markup string, so the text itself is
     never interpreted. */
  function emphasise(text) {
    var fragment = document.createDocumentFragment();
    var parts = String(text).split('*');
    var i;

    for (i = 0; i < parts.length; i += 1) {
      if (!parts[i]) continue;
      if (i % 2 === 1) {
        var em = el('em');
        em.appendChild(document.createTextNode(parts[i]));
        fragment.appendChild(em);
      } else {
        fragment.appendChild(document.createTextNode(parts[i]));
      }
    }

    return fragment;
  }

  /* One authored string may hold several paragraphs, separated by a blank
     line, because a single beat's outcome sometimes needs a beat of its own. */
  function paragraphs(into, text) {
    String(text).split('\n\n').forEach(function (chunk) {
      if (!chunk.trim()) return;
      var p = el('p', 'prose');
      p.appendChild(emphasise(chunk.trim()));
      into.appendChild(p);
    });
  }

  function composureWord(value) {
    if (value >= 9) return 'steady';
    if (value >= 7) return 'holding';
    if (value >= 5) return 'frayed';
    if (value >= 3) return 'thin';
    if (value >= 1) return 'coming apart';
    return 'gone';
  }

  function dots(filled, total) {
    var wrap = el('span', 'dots');
    var i;

    for (i = 0; i < total; i += 1) {
      var dot = el('span', 'dots__dot' + (i < filled ? ' is-filled' : ''));
      wrap.appendChild(dot);
    }

    wrap.setAttribute('aria-label', String(filled) + ' of ' + String(total));
    return wrap;
  }

  function ledgerItem(label, value, modifier) {
    var item = el('div', 'ledger__item' + (modifier ? ' ' + modifier : ''));
    var key = el('span', 'ledger__label');
    key.appendChild(document.createTextNode(label));
    var val = el('span', 'ledger__value');

    if (typeof value === 'string' || typeof value === 'number') {
      val.appendChild(document.createTextNode(String(value)));
    } else {
      val.appendChild(value);
    }

    item.appendChild(key);
    item.appendChild(val);
    return item;
  }

  function renderLedger(state) {
    var projection = global.Economy.projection(state);
    var words = global.SCRIPT.system.projection;

    ledgerEl.textContent = '';
    ledgerEl.appendChild(ledgerItem('Owed', global.Economy.money(state.debt), 'ledger__item--debt'));
    ledgerEl.appendChild(ledgerItem('Cash', global.Economy.money(state.cash)));
    ledgerEl.appendChild(ledgerItem('Rate', String(state.rate) + '% / month'));
    ledgerEl.appendChild(ledgerItem('Nerve', composureWord(state.composure)));
    ledgerEl.appendChild(ledgerItem('People', dots(state.standing, 10)));

    /* The line the whole game is about. When the payment stops covering the
       interest this stops being a date and starts being a word, and that
       transition is the moment the argument lands. */
    var projectionText = projection
      ? words.prefix + ' ' + projection.date.month + ' ' + String(projection.date.year)
      : words.never;

    ledgerEl.appendChild(ledgerItem(
      'Projection',
      projectionText,
      projection ? '' : 'ledger__item--never'
    ));
  }

  function applyMurk(state) {
    var murk = global.State.murk(state);
    document.documentElement.style.setProperty('--murk', String(murk.toFixed(3)));
  }

  /* A card is the only thing the game ever shows. `spec` is:
     { kicker, title, body[], note, statement, choices[], button, onChoose,
       onContinue, extra } */
  function renderCard(spec) {
    var card = el('article', 'card' + (spec.modifier ? ' ' + spec.modifier : ''));

    if (spec.art) card.appendChild(artwork(spec.art, spec.artLabel));

    if (spec.kicker) {
      var kicker = el('p', 'card__kicker');
      kicker.appendChild(document.createTextNode(spec.kicker));
      card.appendChild(kicker);
    }

    if (spec.title) {
      var heading = el('h2', 'card__title');
      heading.appendChild(document.createTextNode(spec.title));
      card.appendChild(heading);
    }

    var body = el('div', 'card__body');
    (spec.body || []).forEach(function (text) { paragraphs(body, text); });
    card.appendChild(body);

    if (spec.note) {
      var note = el('p', 'card__note');
      note.appendChild(emphasise(spec.note));
      card.appendChild(note);
    }

    if (spec.extra) card.appendChild(spec.extra);

    if (spec.choices && spec.choices.length) {
      card.appendChild(choiceList(spec.choices, spec.onChoose));
    }

    if (spec.statement) card.appendChild(spec.statement);

    if (spec.button) {
      var actions = el('div', 'card__actions');
      var button = el('button', 'button');
      button.type = 'button';
      button.appendChild(document.createTextNode(spec.button));
      button.addEventListener('click', spec.onContinue);
      actions.appendChild(button);
      card.appendChild(actions);
    }

    swap(card);
    return card;
  }

  /* Clones an <svg> out of a <template> in index.html.

     The artwork is authored as real markup rather than built node by node
     because it is a drawing, and a drawing is unreadable as a hundred
     createElementNS calls. Cloning a template is not innerHTML — the markup is
     ours, parsed once by the browser at page load, and nothing authored or
     entered ever reaches it.

     `label` carries the premise the picture is replacing. role="img" makes a
     screen reader read that one sentence instead of spelling out the figures
     scattered through the composition, so a player who cannot see the image
     still starts the game knowing who they are and what they owe. */
  function artwork(templateId, label) {
    var template = document.getElementById(templateId);
    var fragment = document.createDocumentFragment();

    if (!template || !template.content) return fragment;

    var clone = template.content.cloneNode(true);
    var svg = clone.querySelector('svg');

    if (svg && label) {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', label);
    }

    fragment.appendChild(clone);
    return fragment;
  }

  function choiceList(choices, onChoose) {
    var list = el('ul', 'choices');

    choices.forEach(function (choice, index) {
      var item = el('li');
      var button = el('button', 'choice');
      button.type = 'button';

      var number = el('span', 'choice__key');
      number.appendChild(document.createTextNode(String(index + 1)));
      button.appendChild(number);

      var text = el('span', 'choice__text');
      var label = el('span', 'choice__label');
      label.appendChild(emphasise(choice.label));
      text.appendChild(label);

      if (choice.hint) {
        var hint = el('span', 'choice__hint');
        hint.appendChild(document.createTextNode(choice.hint));
        text.appendChild(hint);
      }

      button.appendChild(text);
      button.addEventListener('click', function () { onChoose(choice); });
      item.appendChild(button);
      list.appendChild(item);
    });

    return list;
  }

  /* The month's close, rendered as a strip under the outcome. This is the
     drumbeat of the game and it is deliberately not a card of its own — it
     should feel like something that happens to the player rather than
     something they participate in. */
  function statementStrip(record) {
    var words = global.SCRIPT.system.statement;
    var strip = el('div', 'strip' + (record.shortfall ? ' strip--bad' : ''));
    var date = global.Economy.dateFor(record.month - 1);

    function part(label, value) {
      var span = el('span', 'strip__part');
      var key = el('span', 'strip__label');
      key.appendChild(document.createTextNode(label));
      var val = el('span', 'strip__value');
      val.appendChild(document.createTextNode(value));
      span.appendChild(key);
      span.appendChild(val);
      strip.appendChild(span);
    }

    var month = el('span', 'strip__month');
    month.appendChild(document.createTextNode(date.month + ' closes'));
    strip.appendChild(month);

    part(words.interest, global.Economy.money(record.interest));

    if (record.borrowed) {
      part(words.borrowed, global.Economy.money(record.borrowed));
    }

    if (record.shortfall && !record.borrowed) {
      part(words.missed, '+' + String(record.ratcheted) + '%');
    } else {
      part(words.paid, global.Economy.money(record.paid));
    }

    part(words.balance, global.Economy.money(record.debtAfter));
    return strip;
  }

  function swap(card) {
    stage.textContent = '';
    stage.appendChild(card);
    card.classList.add('is-entering');
    /* Reading offsetWidth forces the starting style to be committed, so the
       class removal below actually animates instead of being coalesced away. */
    void card.offsetWidth;
    card.classList.remove('is-entering');

    var focusable = card.querySelector('button');
    if (focusable) focusable.focus();
  }

  /* Number keys pick a choice, Enter presses the single button. The game is
     one column of buttons, so full keyboard play costs almost nothing to
     support and makes it usable without a mouse. */
  function bindKeys() {
    document.addEventListener('keydown', function (event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      var buttons;

      if (/^[1-9]$/.test(event.key)) {
        buttons = stage.querySelectorAll('.choice');
        var index = parseInt(event.key, 10) - 1;
        if (buttons[index]) {
          event.preventDefault();
          buttons[index].click();
        }
        return;
      }

      if (event.key === 'Enter') {
        var button = stage.querySelector('.card__actions .button');
        if (button && document.activeElement !== button) {
          event.preventDefault();
          button.click();
        }
      }
    });
  }

  function theme(next) {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (err) {
      /* Storage refused; the choice still holds for this page view. */
    }
  }

  function currentTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (err) {
      /* Fall through to the default. */
    }
    return 'dark';
  }

  function init() {
    stage = document.getElementById('stage');
    ledgerEl = document.getElementById('ledger');
    theme(currentTheme());
    bindKeys();

    var toggle = document.getElementById('theme-toggle');
    toggle.addEventListener('click', function () {
      theme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  global.Ui = {
    init: init,
    el: el,
    emphasise: emphasise,
    paragraphs: paragraphs,
    renderCard: renderCard,
    renderLedger: renderLedger,
    statementStrip: statementStrip,
    applyMurk: applyMurk,
    composureWord: composureWord,
    showLedgerBar: function (visible) {
      document.getElementById('ledger-bar').hidden = !visible;
    }
  };
})(window);
