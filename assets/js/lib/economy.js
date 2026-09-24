/* The arithmetic the game is an argument about.

   A month runs in two halves. It opens with wages arriving, which is when the
   player has money and therefore choices; it closes with interest and the
   payment, which is when the money leaves. Putting the beat between the two is
   deliberate — whatever a scenario hands you is still in your pocket when you
   decide, and gone by the time the month is over. */
(function (global) {
  'use strict';

  function cfg() {
    return global.GAME;
  }

  function monthlyRate(state) {
    return state.rate / 100;
  }

  function interest(state) {
    return Math.round(state.debt * monthlyRate(state));
  }

  function surplus(state) {
    return state.income - state.expenses;
  }

  /* What the lender insists on: the month's interest plus a token slice of
     principal, so the balance is nominally going down. */
  function minimumDue(state) {
    return Math.round(interest(state) + state.debt * cfg().payment.principalSlice);
  }

  /* What the player can actually hand over: everything above the cash they
     keep back to live on. */
  function affordable(state) {
    return Math.max(0, state.cash - cfg().payment.buffer);
  }

  /* Months until the balance reaches zero at the current rate and payment —
     the standard amortisation term.

     Returns null for "never", and null is the entire thesis of the game. Once
     the payment stops covering the interest the term does not get longer, it
     stops existing, and no amount of discipline brings it back. */
  function monthsToClear(debt, rate, payment) {
    var r = rate / 100;
    var accrued = debt * r;

    if (debt <= 0) return 0;
    if (payment <= accrued) return null;

    return Math.ceil(Math.log(payment / (payment - accrued)) / Math.log(1 + r));
  }

  /* The projection the ledger shows, using the payment the player has actually
     been managing rather than an optimistic one. */
  function projection(state) {
    var payment = Math.max(0, surplus(state));
    var months = monthsToClear(state.debt, state.rate, payment);
    if (months === null) return null;
    /* state.month is 1-based and dateFor is 0-based, so the month the player is
       currently living in is dateFor(state.month - 1). Counting forward from
       anywhere else puts the projection a month into the future and quietly
       flatters the arithmetic. */
    return { months: months, date: dateFor(state.month - 1 + months) };
  }

  function dateFor(monthIndex) {
    var calendar = cfg().calendar;
    var absolute = calendar.startMonth + monthIndex;
    return {
      month: calendar.months[((absolute % 12) + 12) % 12],
      year: calendar.startYear + Math.floor(absolute / 12)
    };
  }

  function ratchet(state, reason) {
    var amount = cfg().ratchet[reason] || 0;
    var before = state.rate;
    state.rate = Math.min(cfg().ratchet.max, state.rate + amount);
    return state.rate - before;
  }

  /* Wages in. Nothing leaves yet. */
  function openMonth(state) {
    state.month += 1;
    state.cash += surplus(state);
    return state;
  }

  /* Interest on, payment off. Returns the record the statement strip renders
     and the ending ledger totals up. `choice` is how the player answered a
     shortfall: 'pay' when they could cover it, or 'miss' / 'borrow' from the
     crisis card. */
  function closeMonth(state, choice) {
    var accrued = interest(state);
    state.debt += accrued;

    var record = {
      month: state.month,
      interest: accrued,
      paid: 0,
      debtAfter: 0,
      shortfall: false,
      ratcheted: 0,
      borrowed: 0
    };

    if (choice === 'borrow') {
      /* Covering a payment with another loan: the shortfall is added to the
         balance and the rate goes up for the privilege. The money genuinely
         passes through the player's hands on the way back to him — it has to be
         added to their cash as well as their debt, or the payment below spends
         money that does not exist and the balance goes negative. */
      var gap = Math.max(0, accrued - state.cash);
      state.debt += gap;
      state.cash += gap;
      state.loansTaken += 1;
      record.borrowed = gap;
      record.ratcheted = ratchet(state, 'newLoan');
      record.shortfall = true;
    } else if (choice === 'miss') {
      state.missedPayments += 1;
      record.shortfall = true;
      record.ratcheted = ratchet(state, 'missedPayment');
      record.debtAfter = state.debt;
      state.statements.push(record);
      return record;
    }

    /* Everything above the buffer goes to him — but never less than the
       interest while the cash is there to cover it.

       Servicing the debt is the test, not the lender's headline "minimum",
       which is the interest plus a slice of principal on top. Treating a
       payment that covers the interest but not the slice as a default would
       make an ordinary month a crisis and put the rate ratchet on a hair
       trigger, and the ratchet only teaches anything if the player can see
       which of their own decisions pulled it. */
    var payment = Math.min(state.cash, state.debt, Math.max(affordable(state), accrued));

    state.cash -= payment;
    state.debt -= payment;
    state.interestPaid += Math.min(payment, accrued);

    record.paid = payment;
    record.debtAfter = state.debt;
    state.statements.push(record);
    return record;
  }

  /* Can the player service the debt at all this month? The loop asks before
     closing so it can raise the crisis card instead of silently defaulting. */
  function willFallShort(state) {
    return state.debt > 0 && state.cash < interest(state);
  }

  /* How far short, for the crisis card. */
  function shortfall(state) {
    return Math.max(0, interest(state) - state.cash);
  }

  function money(amount) {
    var rounded = Math.round(Math.abs(amount));
    var text = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (amount < 0 ? '-' : '') + cfg().currency + text;
  }

  global.Economy = {
    interest: interest,
    surplus: surplus,
    minimumDue: minimumDue,
    affordable: affordable,
    monthsToClear: monthsToClear,
    projection: projection,
    dateFor: dateFor,
    ratchet: ratchet,
    openMonth: openMonth,
    closeMonth: closeMonth,
    willFallShort: willFallShort,
    shortfall: shortfall,
    money: money
  };
})(window);
