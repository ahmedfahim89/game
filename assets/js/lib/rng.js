/* Seeded pseudo-randomness.

   Every roll in the game comes from here, and the seed is recorded in the save
   and shown on the ending screen. That matters for two reasons: a balance sweep
   can replay an exact run, and a player who suspects the game cheated them can
   replay it too. A game that argues gambling is honestly stacked against you
   has to be honest about its own dice. */
(function (global) {
  'use strict';

  /* mulberry32 — small, fast, and statistically fine at this scale. */
  function create(seed) {
    var state = seed >>> 0;

    function next() {
      state += 0x6D2B79F5;
      var x = state;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    }

    next.seed = seed >>> 0;
    return next;
  }

  function randomSeed() {
    return (Math.random() * 4294967296) >>> 0;
  }

  /* Seeds are shown to players and typed back in, so they are rendered in the
     base that keeps them short and unambiguous. */
  function format(seed) {
    return (seed >>> 0).toString(36).toUpperCase();
  }

  function parse(text) {
    var value = parseInt(String(text || '').trim(), 36);
    return isNaN(value) ? null : (value >>> 0);
  }

  global.Rng = {
    create: create,
    randomSeed: randomSeed,
    format: format,
    parse: parse
  };
})(window);
