/* Every tunable number in Underwater lives in this file. Nothing else in
   assets/js/ hard-codes a quantity, so the whole economy can be retuned here
   without reading another line of code.

   The opening position is deliberately survivable. An obviously impossible
   debt makes a player disengage in three minutes and teaches them nothing; a
   debt that looks beatable and then isn't is the actual experience the game is
   about. With the numbers below, a player who never misses a payment and never
   takes a shortcut clears the balance in 31 months — and the game ends at 30. */
(function (global) {
  'use strict';

  global.GAME = {
    title: 'Underwater',
    currency: '€',

    start: {
      cash: 300,
      debt: 14000,
      rate: 4,
      income: 1900,
      expenses: 1100,
      composure: 7,
      standing: 6,
      self: 5,
      exposure: 0
    },

    /* February 2026 through July 2028. */
    calendar: {
      startMonth: 1,
      startYear: 2026,
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December']
    },

    totalMonths: 30,

    payment: {
      /* Cash held back each month for food and fuel; the rest goes to Luca "The Undertaker". */
      buffer: 200,
      /* The token slice of principal the lender adds on top of the interest to
         make the minimum look like progress. */
      principalSlice: 0.01
    },

    /* The trap does not close on its own — the player closes it. Every missed
       payment and every new loan raises the rate permanently, and two of them
       are enough to push the interest past what the surplus can cover. */
    ratchet: {
      missedPayment: 2,
      newLoan: 1.25,
      max: 18
    },

    wager: {
      /* Expected return per unit staked. Stated in the README on purpose: the
         game's claim about gambling is only honest if the number is public and
         the rolls are real. */
      expectedReturn: 0.85,
      /* Losing rattles you, and a rattled player is offered a bigger stake.
         This is the whole mechanism of the trap, so it is a tunable, not a
         hidden fudge. */
      tiltPerLoss: 1,
      tiltStakeBonus: 0.3
    },

    greed: {
      /* Chance per month of the bill arriving, scaled by accumulated exposure.
         At 50 exposure that is a 15% chance every single month. */
      collectionChance: 0.3
    },

    ruin: {
      debt: 60000,
      composure: 0
    },

    /* Stat ceilings, so an effect can never push a bar off the end. */
    bounds: {
      composure: [0, 10],
      standing: [0, 10],
      self: [0, 10],
      exposure: [0, 100],
      rate: [0, 18]
    },

    /* How murky the screen gets. Debt and composure each contribute; the
       creditor's face is chosen from the same value, so a player who keeps
       their head genuinely sees a less surreal game. */
    murk: {
      debtFloor: 14000,
      debtCeiling: 45000,
      composureWeight: 0.5
    },

    storageKey: 'underwater-run'
  };
})(window);
