/* The run: every number the game tracks, and the only code allowed to change
   one. Content declares *what* an effect is; this file decides what an effect
   is permitted to do. */
(function (global) {
  'use strict';

  /* The complete set of stats a content effect may name. The validator in
     tools/checks.html checks every authored effect against this list, which is
     how a typo like "compsure" gets caught without a compiler. Add a stat here
     and nowhere else. */
  var NUMERIC_KEYS = ['cash', 'debt', 'rate', 'income', 'expenses',
    'composure', 'standing', 'self', 'exposure'];

  /* Flags are one-way: once you have told someone the truth, you cannot untell
     them. Content sets them by name and never clears them. */
  var FLAG_KEYS = ['disclosed', 'restructured', 'bargained', 'quit', 'caught'];

  function clamp(key, value) {
    var bounds = global.GAME.bounds[key];
    if (!bounds) return value;
    return Math.min(bounds[1], Math.max(bounds[0], value));
  }

  function create(seed) {
    var start = global.GAME.start;

    return {
      seed: seed >>> 0,
      month: 0,

      cash: start.cash,
      debt: start.debt,
      rate: start.rate,
      income: start.income,
      expenses: start.expenses,
      composure: start.composure,
      standing: start.standing,
      self: start.self,
      exposure: start.exposure,

      /* Gambling is only indicted honestly if the totals are kept honestly.
         Both are shown, unrounded, on the ending screen. */
      wagered: 0,
      returned: 0,
      wagers: 0,

      missedPayments: 0,
      loansTaken: 0,
      collections: 0,
      interestPaid: 0,

      flags: {},
      history: [],
      statements: [],
      ended: null
    };
  }

  /* Applies a content-authored effect block. Unknown keys are ignored rather
     than thrown so a bad content edit cannot white-screen a player mid-run —
     but tools/checks.html fails loudly on them, which is where that mistake is
     supposed to be caught. */
  function apply(state, effects) {
    if (!effects) return;

    NUMERIC_KEYS.forEach(function (key) {
      if (typeof effects[key] !== 'number') return;
      state[key] = clamp(key, state[key] + effects[key]);
    });

    /* Cash is the one stat that must never go negative: a scenario that costs
       more than the player has takes what is there and the shortfall shows up
       as a missed payment at month end, not as an impossible balance. */
    if (state.cash < 0) state.cash = 0;
    if (state.debt < 0) state.debt = 0;
  }

  function raise(state, flag) {
    if (FLAG_KEYS.indexOf(flag) === -1) return;
    state.flags[flag] = true;
  }

  function has(state, flag) {
    return state.flags[flag] === true;
  }

  /* Does the run satisfy a content-authored gate? Gates read
     { composure: { min: 4 }, disclosed: true } — numeric ranges on stats,
     booleans on flags. A gate naming something unknown fails closed, so a
     mistyped gate hides its choice rather than silently always passing. */
  function meets(state, gate) {
    if (!gate) return true;

    var keys = Object.keys(gate);
    var i;

    for (i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var want = gate[key];

      if (FLAG_KEYS.indexOf(key) !== -1) {
        if (has(state, key) !== (want === true)) return false;
      } else if (NUMERIC_KEYS.indexOf(key) !== -1) {
        if (typeof want.min === 'number' && state[key] < want.min) return false;
        if (typeof want.max === 'number' && state[key] > want.max) return false;
      } else {
        return false;
      }
    }

    return true;
  }

  /* 0 to 1. Drives the page tint, the transition speed and which face the
     creditor is wearing. Debt pushes it up, composure holds it down. */
  function murk(state) {
    var cfg = global.GAME.murk;
    var span = cfg.debtCeiling - cfg.debtFloor;
    var fromDebt = (state.debt - cfg.debtFloor) / span;
    var fromNerve = (10 - state.composure) / 10;
    var value = (fromDebt + fromNerve * cfg.composureWeight) / (1 + cfg.composureWeight);
    return Math.min(1, Math.max(0, value));
  }

  function save(state) {
    try {
      localStorage.setItem(global.GAME.storageKey, JSON.stringify(state));
    } catch (err) {
      /* Private browsing refuses storage. The run still works; it just will not
         survive a reload, and the player finds that out only if they reload. */
    }
  }

  function load() {
    var raw = null;

    try {
      raw = localStorage.getItem(global.GAME.storageKey);
    } catch (err) {
      return null;
    }

    if (!raw) return null;

    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed.month === 'number' ? parsed : null;
    } catch (err) {
      return null;
    }
  }

  function clear() {
    try {
      localStorage.removeItem(global.GAME.storageKey);
    } catch (err) {
      /* Nothing to do; a stale save is harmless next launch. */
    }
  }

  global.State = {
    NUMERIC_KEYS: NUMERIC_KEYS,
    FLAG_KEYS: FLAG_KEYS,
    create: create,
    apply: apply,
    raise: raise,
    has: has,
    meets: meets,
    murk: murk,
    save: save,
    load: load,
    clear: clear
  };
})(window);
