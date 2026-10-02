# Underwater, months 1 to 3: gamer report

Traced by hand by the `gamer` agent on 2026-10-03, after the reload fix landed. Nothing was run
in a browser, so every number needs confirming there. Known defects (month-0 and ended reload
guard, rng reload preview, debt cap, the 3 failing Simulate checks) were set aside on request.
Hidden stats (self, standing, exposure) are developer-only.

## Rules behind the numbers

- Start: cash 300, debt 14,000, rate 4%, surplus 800, composure 7, standing 6, self 5, exposure 0.
- Month: `openMonth` adds 800, then the beat, then `collectionRoll`, then the crisis test, then
  `closeMonth` (interest on, payment of min(cash, debt, max(cash - 200, interest))).
- No crisis is reachable in months 1 to 3. Every path ends each month on cash 200, rate 4%.
- No beat is tagged greed, so exposure stays 0 and nothing random happens. Months 1 to 3 are the same for every seed.
- Projection assumes the 800 surplus, not the sweep. Month 1 reads "Clear by September 2028"; the last game month is July 2028.
- Month 1 is February 2026, month 2 March, month 3 April.

## 1. Paths

Naming: M1 is P (pay) / W (wait) / K (ask). W and K match on cash, debt and composure; K has self +1.
M2 is Wk (work) / G (go) / H (hide). M3 is In (bet) / Out (decline).

### After month 1

| M1 | Interest | Paid | Debt | Cash | Composure | Self | Projection |
|---|---|---|---|---|---|---|---|
| P | 548 | 600 | 13,648 | 200 | 8 | 5 | Aug 2028 |
| W | 560 | 900 | 13,660 | 200 | 6 | 5 | Aug 2028 |
| K | 560 | 900 | 13,660 | 200 | 6 | 6 | Aug 2028 |

### After month 2

| M1/M2 | Interest | Paid | Debt | Composure | Standing | Self | Projection |
|---|---|---|---|---|---|---|---|
| P/Wk | 546 | 1,060 | 13,134 | 7 | 5 | 5 | Jul 2028 |
| P/G | 546 | 760 | 13,434 | 8 | 7 | 6 | Aug 2028 |
| P/H | 546 | 760 | 13,434 | 8 | 7 | 4 | Aug 2028 |
| W/Wk | 546 | 1,060 | 13,146 | 5 | 5 | 5 | Jul 2028 |
| K/Wk | 546 | 1,060 | 13,146 | 5 | 5 | 6 | Jul 2028 |
| W/G | 546 | 760 | 13,446 | 6 | 7 | 6 | Aug 2028 |
| K/G | 546 | 760 | 13,446 | 6 | 7 | 7 | Aug 2028 |
| W/H | 546 | 760 | 13,446 | 6 | 7 | 4 | Aug 2028 |
| K/H | 546 | 760 | 13,446 | 6 | 7 | 5 | Aug 2028 |

### After month 3

| Path (M1/M2/M3) | Stake | Interest | Paid | Debt | Composure | Self | Standing | Projection |
|---|---|---|---|---|---|---|---|---|
| P/Wk/In | 150 | 525 | 950 | 12,709 | 8 | 5 | 5 | Jun 2028 |
| P/Wk/Out | n/a | 525 | 800 | 12,859 | 6 | 6 | 5 | Jul 2028 |
| P/G/In | 150 | 537 | 950 | 13,021 | 9 | 6 | 7 | Jul 2028 |
| P/G/Out | n/a | 537 | 800 | 13,171 | 7 | 7 | 7 | Aug 2028 |
| P/H/In | 150 | 537 | 950 | 13,021 | 9 | 4 | 7 | Jul 2028 |
| P/H/Out | n/a | 537 | 800 | 13,171 | 7 | 5 | 7 | Aug 2028 |
| W or K/Wk/In | 240 | 526 | 1,040 | 12,632 (lowest) | 6 | W5 / K6 | 5 | Jun 2028 |
| W or K/Wk/Out | n/a | 526 | 800 | 12,872 | 4 | W6 / K7 | 5 | Jul 2028 |
| W or K/G/In | 200 | 538 | 1,000 | 12,984 | 7 | W6 / K7 | 7 | Jul 2028 |
| W or K/G/Out | n/a | 538 | 800 | 13,184 (highest) | 5 | W7 / K8 | 7 | Aug 2028 |
| W or K/H/In | 200 | 538 | 1,000 | 12,984 | 7 | W4 / K5 | 7 | Jul 2028 |
| W or K/H/Out | n/a | 538 | 800 | 13,184 | 5 | W5 / K6 | 7 | Aug 2028 |

Cash is 200 and exposure 0 on every row. The debt spread across all 18 combinations is 552.
A bet records wagered = stake and returned = 2 x stake, a realised return of 2.00.

Worked example (P/G/In): month 1 ends cash 200, debt 13,648. Month 2 (go, cash -40) ends debt 13,434.
Month 3 at composure 8: stake 150, scripted win +150, composure +1, interest 537, payment 950, debt 13,021.

## 2. Month 3 wager

Stake = base 150 x (1 + max(0, 7 - composure) x 0.3), rounded to the nearest 10. Multiplier 2,
derived chance 0.85 / 2 = 42.5%, resolved as a win 100% of the time (scripted).

| Composure entering M3 | Reached by | Stake | Returned | Net | Receipt |
|---|---|---|---|---|---|
| 8 | P/G, P/H | 150 | 300 | +150 | Staked 150, Returned 300, Chance of that 43% |
| 7 | P/Wk | 150 | 300 | +150 | same |
| 6 | W or K / G, H | 200 | 400 | +200 | Staked 200, Returned 400, 43% |
| 5 | W or K / Wk | 240 | 480 | +240 | Staked 240, Returned 480, 43% |

The lose branch is unreachable (`scripted: 'win'`, no `effectsLose`). The stake is never shown
before the bet, and the receipt rounds 42.5% to 43% with no net row.

## 3. Hint against true effect

| Choice | Hint | True effect |
|---|---|---|
| M1 Pay | "Costs €300, straight off the balance." | Net cost against Wait is 0 after the sweep; saves 12 of interest and gives composure +2 against Wait. |
| M1 Wait | "Costs nothing today." | The sweep takes the same 900 anyway. Composure -1, buys nothing. |
| M1 Ask | "Requires a clear head." | Composure -1, self +1. No rate effect. |
| M2 Work | "+€260. Teresa will understand." | 300 debt swing against Go. Standing -1, composure -1. |
| M2 Go | "Costs about €40." | Exactly 40. Standing +1, self +1. |
| M2 Hide | "Costs about €40." | Identical to Go on money and standing. Self -1 (hidden). |
| M3 In | "Doubles if it comes in, but you doubt it." | Guaranteed win, net +150 / +200 / +240 to debt. Composure +1. |
| M3 Out | "Nothing happens." | Self +1, composure -1 (hidden). The decliner never sees the stake or figure passed up. |

## 4. Player-experience critique

### First-time player
- Three cards with the same rhythm, and it is impossible to fail. That suits an opening.
- The projection is the one legible tension, but the ledger has no month counter and never says where the game ends, so the Work/Go flip from July to August 2028 is invisible.
- The sweep teaches badly: the player hands over 300 and the strip says "paid 600".
- Wait is dominated by Pay and by Ask on every number.
- Month 2's "3 of 4 places taken" scarcity has no mechanical effect.
- The odds print after a bet resolves, not before. The decliner is told to regret a number they never saw.
- The Go outcome says "1 Saturday (€260 forgone)", but the body says Saturday and Sunday for €260, and the true swing is 300. One sentence ("You cannot make the math say to yourself...") is awkward.

### Min-maxer
- Lowest debt after 3 months: wait or ask, then work, then bet (12,632). That path has composure 5 entering month 3, so tilt gives the scripted win its largest stake (240 against 150). A rattled player is paid more on a bet that cannot lose.
- All the money levers are small (552 across 18 paths). The real stakes are in hidden stats.
- Ashore is nearly locked in by month 4 (ask, go, out, truth gives self 10 capped).
- Hide is strictly dominated by Go.
- The scripted win makes the ending ledger read "200 cents per euro" with nothing separating it from honest rolls.

### Convention observations
- `content/script.js` breaks the digits-for-cardinals rule at line 37 ("One bad month became three. Three became twelve."). Ordinals at lines 41, 68, 70, 112 and 320 are correctly words under the rule, so the agent's flag on them does not hold.
- `main.js` and `ui.js` hard-code some words ("Staked", "Returned", "Chance of that", "Short by", "Next month", "Continue", ledger labels), which blurs the prose/rules line.

## 5. Ranked ideas (all respect the invariants)

1. **Horizon marker on the projection** (S-M, rules plus content). Show "Month 3 of 30" with the end date, and mark the projection once its date falls past the final month. Recommended first.
2. **Show the bet before it is placed** (M). A derived second hint line, "Stake €150 · pays 2x · 42.5%", words in `SCRIPT.system.wager`.
3. **Make the sweep legible in month 1** (S, content). Rewrite the Pay and Wait hints to say the month-end payment takes the money either way. Do not hard-code the 12.
4. **Give Hide a visible temptation** (S, content). For example standing +2 against hidden self -1.
5. **Decouple the scripted win from tilt** (S, content). Set `stake: 150` in `c1-first-bet-in`.
6. **Small-stake alternative at month 3** (S). Keep it unscripted to protect the first-bet invariant.
7. **Counterfactual receipt for the decliner** (M). Risk: it can push the player toward betting.
8. **Ledger line for the scripted win** (S). Split scripted and unscripted rolls in the ending.
9. **Prose clean-up** (S). Fix the Go outcome (Saturday/Sunday, 260 against the true 300) and the awkward sentence.
