# Underwater, months 1 and 2: outcome table

Traced by hand by the `gamer` agent from the code as it stood on 2026-10-02. Not run in a
browser and not checked against `tools/checks.html`. Hidden stats (self, standing, exposure)
are developer-only and must never appear in the player's view.

Start: cash 300, debt 14,000, rate 4%, surplus 800, composure 7, standing 6, self 5,
exposure 0. Month 2 opens at cash 1,000 in every branch. No crisis fires in any path, and no
random event can occur because exposure stays 0.

## Month 1 (same result for every month 2 choice)

| Choice | Effects | Interest | Payment | After close: cash / debt / rate / composure | Projection |
|---|---|---|---|---|---|
| A pay | cash -300, debt -300, composure +1 | 548 | 600 | 200 / 13,648 / 4 / 8 | August 2028 |
| B wait | composure -1 | 560 | 900 | 200 / 13,660 / 4 / 6 | August 2028 |
| C ask (needs composure 6+) | composure -1, self +1 | 560 | 900 | 200 / 13,660 / 4 / 6 | August 2028 |

## Months 1 and 2: all 9 paths

| # | Mo1 | Mo2 | Interest | Payment | After Mo2: cash / debt / rate / composure | Projection | Dev-only: self / standing / exposure |
|---|---|---|---|---|---|---|---|
| 1 | pay | work | 546 | 1,060 | 200 / 13,134 / 4 / 7 | July 2028 | 5 / 5 / 0 |
| 2 | pay | go | 546 | 760 | 200 / 13,434 / 4 / 8 | August 2028 | 6 / 7 / 0 |
| 3 | pay | hide | 546 | 760 | 200 / 13,434 / 4 / 8 | August 2028 | 4 / 7 / 0 |
| 4 | wait | work | 546 | 1,060 | 200 / 13,146 / 4 / 5 | July 2028 | 5 / 5 / 0 |
| 5 | wait | go | 546 | 760 | 200 / 13,446 / 4 / 6 | August 2028 | 6 / 7 / 0 |
| 6 | wait | hide | 546 | 760 | 200 / 13,446 / 4 / 6 | August 2028 | 4 / 7 / 0 |
| 7 | ask | work | 546 | 1,060 | 200 / 13,146 / 4 / 5 | July 2028 | 6 / 5 / 0 |
| 8 | ask | go | 546 | 760 | 200 / 13,446 / 4 / 6 | August 2028 | 7 / 7 / 0 |
| 9 | ask | hide | 546 | 760 | 200 / 13,446 / 4 / 6 | August 2028 | 5 / 7 / 0 |

No flags are set in any path.

## Outcome prose (opening phrase)

| Choice | Opens with |
|---|---|
| `c1-arrangement-pay` | "He counts it twice, writes a number in the notebook, and nods once." |
| `c1-arrangement-wait` | "'It will,' he agrees, and that is worse than an argument." |
| `c1-arrangement-ask` | "He looks at you properly for the first time in a year." |
| `c1-birthday-work` | "You do 14 hours on Saturday and 9 on Sunday." |
| `c1-birthday-go` | "You are the one who ends up carrying the cake." |
| `c1-birthday-hide` | "You are good at lying." |
| Crisis, miss | "No phone call. No visit." |
| Crisis, borrow | "You say it out loud in the car park..." |

## Hint text against true effect

| Choice | Hint | True effect | Match |
|---|---|---|---|
| `c1-arrangement-pay` | "Costs €300, straight off the balance. He will remember it." | cash -300, debt -300, composure +1. Net gain after the sweep is 12. Nothing later reads "he will remember it". | Mostly |
| `c1-arrangement-wait` | "Costs nothing today." | composure -1 only | Yes |
| `c1-arrangement-ask` | "Requires a clear head." | composure -1, self +1, rate unchanged. Label promises a rate cut that never happens. | Mismatch |
| `c1-birthday-work` | "+€260. Teresa will understand." | cash +260, standing -1, composure -1 | Hides costs |
| `c1-birthday-go` | "Costs about €40." | cash -40, standing +1, self +1 | Yes |
| `c1-birthday-hide` | "Costs about €40." | cash -40, standing +1, self -1. Identical to `go` on every visible number. | Yes |
| `crisis-miss` | "He adds 2 points to the rate. Permanently." | rate +2, no payment, interest still added | Yes |
| `crisis-borrow` | "The gap goes on the balance, and the rate goes up." | gap added to debt, rate +1.25 | Yes |

## Observations

- Work beats go by exactly 300 on the balance, and the projection moves a month earlier.
- Paying Luca in month 1 is worth only 12 on the balance (13,648 against 13,660).
- `go` and `hide` are identical on the visible ledger. Only the hidden self stat and the prose differ.
- `ask` has no mechanical benefit and never moves the rate.
- The projection after month 1 reads August 2028 whatever the player does, which is month 31 counted from February 2026.
- `c1-birthday-go` outcome has an awkward, unfinished-sounding sentence about "the math".
- The crisis body says "the minimum", but the test is the interest.

## Reload (as of this trace)

`main.js` `boot()` still steps the month back and subtracts the surplus, so a reload after any
close replays that month with post-close money and forces a crisis. The save-time fix had not
landed when this was traced.
