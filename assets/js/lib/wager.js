/* Betting.

   The house edge is a single published number and the probability of every
   wager is derived from it, so a content author picks the payout that suits the
   scene and the engine works out the honest odds to match. There is no
   difficulty curve hidden in here and no rubber-banding: a 5x payout really is
   a 17% chance, every time, and the ending screen prints what the player
   actually staked against what actually came back. */
(function (global) {
  'use strict';

  function cfg() {
    return global.GAME.wager;
  }

  /* Derived, never authored. Payout m at expected return e means you win
     e / m of the time — the only probability that makes the stated edge true. */
  function chance(multiplier) {
    return cfg().expectedReturn / multiplier;
  }

  /* The stake the game *suggests*, which grows as the player comes apart.
     Nobody is ever forced to bet. They are just offered a bigger number at
     exactly the moment a bigger number sounds reasonable, which is how this
     works in life and is the only reason the lesson lands. */
  function suggestedStake(state, base) {
    var rattled = global.GAME.start.composure - state.composure;
    var scaled = base * (1 + Math.max(0, rattled) * cfg().tiltStakeBonus);
    var ceiling = Math.max(0, state.cash);
    return Math.max(0, Math.min(ceiling, Math.round(scaled / 10) * 10));
  }

  /* Resolves one bet and books it. `spec.scripted` exists for a single beat in
     chapter one: the first bet always wins.

     That is not the game cheating in its own favour — it is the game being
     accurate. Almost nobody's first bet loses, and a version where it did would
     be a strawman the player would be right to dismiss. Every roll after it is
     the real thing. */
  function resolve(state, rng, spec) {
    var multiplier = spec.multiplier;
    var stake = Math.min(spec.stake, state.cash);
    var won = spec.scripted === 'win' ? true
      : spec.scripted === 'lose' ? false
        : rng() < chance(multiplier);
    var payout = won ? Math.round(stake * multiplier) : 0;

    state.cash += payout - stake;
    state.wagered += stake;
    state.returned += payout;
    state.wagers += 1;

    if (!won) {
      state.composure = Math.max(0, state.composure - cfg().tiltPerLoss);
    }

    return {
      won: won,
      stake: stake,
      payout: payout,
      net: payout - stake,
      multiplier: multiplier,
      chance: chance(multiplier),
      /* Reported so the balance harness can measure the realised edge over
         honest rolls only. Averaging the scripted first win in with the rest
         would make the house edge look like a house gift. */
      scripted: !!spec.scripted
    };
  }

  /* What the player got back per unit staked, for the ending ledger. Null
     before they have bet anything, so the screen can stay silent rather than
     print a meaningless zero at someone who never gambled. */
  function realisedReturn(state) {
    if (!state.wagered) return null;
    return state.returned / state.wagered;
  }

  global.Wager = {
    chance: chance,
    suggestedStake: suggestedStake,
    resolve: resolve,
    realisedReturn: realisedReturn
  };
})(window);
