/* Which ending the run earns, and the honest numbers printed underneath it.

   The gates are ordered and the first match wins. Read them as the game's
   actual argument, because that is what they are — in particular `ashore`,
   the best ending in the game, which does not look at `debt` at all. You can
   reach it still owing forty thousand, and you can clear the balance to zero
   and land in `hollow` instead. That is the whole thesis expressed as an if
   statement, and if it ever grows a debt condition the game stops meaning what
   it says. */
(function (global) {
  'use strict';

  var GATES = [
    {
      id: 'drowned',
      /* The only gate that can fire mid-run: the arithmetic finished early. */
      duringPlay: true,
      test: function (state) {
        return state.debt > global.GAME.ruin.debt
          || state.composure <= global.GAME.ruin.composure;
      }
    },
    {
      id: 'new-creditor',
      test: function (state) {
        return global.State.has(state, 'bargained');
      }
    },
    {
      id: 'whale',
      /* Deliberately reachable. A game that made winning impossible would be
         lying, and the player would catch it. It is just rare, and the ending
         itself shows you how rare by printing what the same bets returned. */
      test: function (state) {
        return state.cash >= 50000 && state.returned > state.wagered;
      }
    },
    {
      id: 'hollow',
      test: function (state) {
        return state.debt <= 0 && state.standing <= 2;
      }
    },
    {
      id: 'ashore',
      test: function (state) {
        return state.self >= 7
          && global.State.has(state, 'disclosed')
          && state.standing >= 5;
      }
    },
    {
      id: 'still-swimming',
      test: function () { return true; }
    }
  ];

  /* Called every month. Returns an ending id only for the gates that are
     allowed to cut a run short. */
  function checkRuin(state) {
    var i;

    for (i = 0; i < GATES.length; i += 1) {
      if (GATES[i].duringPlay && GATES[i].test(state)) return GATES[i].id;
    }

    return null;
  }

  /* Called when the last month closes. */
  function resolve(state) {
    var i;

    for (i = 0; i < GATES.length; i += 1) {
      if (GATES[i].test(state)) return GATES[i].id;
    }

    return 'still-swimming';
  }

  function prose(id) {
    var endings = global.SCRIPT.endings;
    var i;

    for (i = 0; i < endings.length; i += 1) {
      if (endings[i].id === id) return endings[i];
    }

    return null;
  }

  /* The numbers the game has been keeping quietly. Most of these are not shown
     anywhere during play, and the gap between what the player thinks happened
     and what this prints is most of the point of the ending screen. */
  function ledger(state) {
    return {
      seed: state.seed,
      /* Months actually lived through, not the counter — a run that stops
         because it ran out of written months has already incremented into one
         it never played. */
      months: state.statements.length,
      debt: state.debt,
      cash: state.cash,
      rate: state.rate,
      interestPaid: state.interestPaid,
      wagers: state.wagers,
      wagered: state.wagered,
      returned: state.returned,
      realised: global.Wager.realisedReturn(state),
      exposure: state.exposure,
      collections: state.collections,
      missedPayments: state.missedPayments,
      loansTaken: state.loansTaken,
      self: state.self,
      standing: state.standing,
      disclosed: global.State.has(state, 'disclosed'),
      turningPoints: global.Scenarios.turningPoints(state)
    };
  }

  global.Endings = {
    GATES: GATES,
    checkRuin: checkRuin,
    resolve: resolve,
    prose: prose,
    ledger: ledger
  };
})(window);
