# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**Underwater** — a 30-month narrative game arguing four things: debt is unpayable,
gambling is risky, greed costs you later, and you can be alright without being solvent.
See `README.md` for the design; this file is about the constraints.

## The hard constraint: buildless, and no network at all

There is no Node, no npm and no usable Python on this machine — only git and PowerShell.
There is no `package.json`, no bundler, no transpiler and no TypeScript, and this was a
deliberate decision rather than a limitation to route around. Never propose a package,
build step or framework without first saying what it costs. Assume the answer is no.

**Nothing may call `fetch`, `XMLHttpRequest` or load from a CDN.** The game has to play by
double-clicking `index.html` from the filesystem, and `fetch` is blocked on `file://`
origins. This is why `content/script.js` is a `<script>`-loaded JS file assigning
`window.SCRIPT` rather than the JSON file it obviously wants to be. Turning it into JSON
would break the game everywhere except a server, silently.

`tools/serve.ps1` exists only because some browser previews refuse to execute scripts from
`file://`. It is a development convenience and nothing in the game depends on it.

## Verification

There is no test framework and none will be installed.

**`tools/checks.html` is the whole safety net. Run it after every content edit.** It has
two halves:

- **Validate** — walks `window.SCRIPT` and fails on unknown effect keys, unknown flags,
  gates naming stats that do not exist, duplicate or dangling ids, wagers missing a
  multiplier or a win/lose outcome, and gaps in the month spine. This is the buildless
  substitute for a compiler, and it exists for one specific failure: an effect key typo
  (`compsure` for `composure`) does nothing at all in the game and says nothing about it.
- **Simulate** — plays the script headlessly under fixed strategy profiles and checks the
  game's four claims against its own arithmetic. If the `always-grind` row starts clearing
  the balance, the game has stopped meaning what it says.

Then play it, and read the browser console — a silent JS error is the most common way a
page like this breaks.

## Architecture

### The prose/rules line

`content/script.js` holds **every word and every effect value, and no logic**.
`assets/js/` holds **every rule, and no prose** — including the words on engine-raised
cards, which live in `SCRIPT.system`. Do not blur this. It is what lets the script be
rewritten without touching a rule and the economy retuned without touching a word.

### Module pattern: globals, not modules

No loader. Each file is an IIFE with `'use strict';` hanging one namespace off `window`,
loaded by hand-ordered `<script>` tags at the bottom of `index.html`. Add a module and you
must add its tag, in dependency order, to `index.html` **and** `tools/checks.html`.

| File | Exports | Responsibility |
| --- | --- | --- |
| `config.js` | `GAME` | Every tunable number. The one file you edit to rebalance. |
| `lib/rng.js` | `Rng` | Seeded mulberry32, seed formatting |
| `lib/state.js` | `State` | The run, effect application, gates, save/load, murk |
| `lib/economy.js` | `Economy` | Interest, payments, the projection, the rate ratchet |
| `lib/wager.js` | `Wager` | Bet resolution, derived odds, tilt |
| `lib/scenarios.js` | `Scenarios` | Beat selection, choice gating, collection events |
| `lib/endings.js` | `Endings` | Ending gates and the final ledger |
| `ui.js` | `Ui` | Rendering, cards, the murk, keyboard |
| `main.js` | — | The month loop |

### Artwork

Illustrations are hand-authored inline SVG in a `<template>` in `index.html`, cloned into
a card by `Ui.artwork()`. Three reasons, all of which rule out the obvious alternatives:

- **Inline, not `<img src="...svg">`** — an `<img>` document cannot see this page's custom
  properties, so it could not follow the light/dark theme. Every colour in the artwork is
  a `--art-*` token declared in both theme blocks.
- **A cloned `<template>`, not `createElementNS` calls** — a drawing is unreadable as a
  hundred DOM constructor lines. Cloning static author markup is not `innerHTML`; nothing
  authored or user-entered ever reaches it, so the no-`innerHTML` rule still holds.
- **`<text>`, not paths** — figures in the art stay real, selectable text.

A card with art takes `art` (a template id) and `artLabel`. **The label is not a
description of the picture — it is the prose the picture replaced**, written out in the
same voice, so a player using a screen reader starts with the same premise a sighted
player gets. `role="img"` is set alongside it, which means the label is read *instead of*
the scattered figures inside the composition. If you change what an image says, change its
label in the same edit.

### Invariants that carry the meaning

Change any of these and the game stops making its argument. They are not style choices.

- **The `ashore` gate in `lib/endings.js` must never reference `debt`.** It is the best
  ending and it checks `self`, `disclosed` and `standing` only. A player must be able to
  reach it still deep in debt. This is message four expressed as an `if` statement.
- **The house edge is one published number** (`GAME.wager.expectedReturn`) and every win
  probability is *derived* from the authored payout. Never author a probability directly.
  The true odds are printed on every bet.
- **The scripted first win** (`c1-first-bet`, `scripted: 'win'`) is intentional and should
  stay. A game where your first bet loses is a strawman.
- **A greed choice must always be the best option on the visible numbers.** If greed looks
  bad, refusing it is not a decision.
- **The crisis test is the interest, not `minimumDue`.** `minimumDue` is the lender's
  headline figure — interest plus a slice of principal. Testing against it puts the rate
  ratchet on a hair trigger and makes an ordinary month a crisis, and the ratchet only
  teaches anything if the player can trace it to a decision they made.
- **`self` and `exposure` are never shown during play.** A visible number becomes a score
  to optimise, and both have to be things the player discovers they were accruing.

### The month

`Economy.openMonth` (wages in) → the beat → `Scenarios.collectionRoll` → crisis card if
`Economy.willFallShort` → `Economy.closeMonth` (interest on, payment off). The beat sits
between the two halves deliberately: what a scenario hands you is still in your pocket
while you decide and gone by the time the month ends.

### The sweep — read this before reporting it as a bug

The payment in `Economy.closeMonth` is one line:

```js
var payment = Math.min(state.cash, state.debt, Math.max(affordable(state), accrued));
```

`affordable` is `cash − buffer`, and the buffer is €200. So **at the end of every month the
lender takes everything the player is holding above €200.** It is automatic, the player
never chooses the amount, and there is no way to save. This is the single most
counter-intuitive rule in the game and it is deliberate. It is not a rounding error, a
double-charge or a missing input.

Three consequences follow, and all three are intended:

- **Cash is not a resource you keep.** Nearly every month ends on exactly €200 regardless
  of what happened during it. The €200 is a floor you return to, not savings.
- **Money gained in a beat is debt reduction, not income**, and **money spent in a beat is
  debt, not cash.** Pay €900 for the compressor and you still end on €200, exactly like
  someone who paid nothing — the whole difference lands in the balance. This is the
  mechanical form of the game's first claim.
- **The buffer is not sacred.** The `Math.max` means that when `cash − 200` is less than
  the interest, the payment digs *below* €200 to service the debt — correct behaviour, and
  it can leave the player on single-digit cash. Only when cash cannot cover the interest at
  all does `willFallShort` fire and raise the crisis card.

A month where the player pays the interest exactly and the balance ends where it started
is also correct, and is the clearest statement the game makes.

**The one place the sweep genuinely does hide a bug:** a choice whose fiction is *handing
money to the lender* must carry a matching negative `debt` alongside its negative `cash`.
Without it the money leaves the pocket, never reaches the balance, and the sweep hides the
loss — both branches end on €200 and only the debt column differs, so paying him comes out
*worse* than refusing. That was real in `c1-arrangement-pay` and is fixed. Every other cash
cost in the game is an expense (Abel, the dinner), where touching cash and not debt is
correct. When auditing a new beat, ask which of the two it is.

## Conventions

**JavaScript** — ES5-flavoured: `var`, function expressions, no `let`/`const`/arrow
functions/template literals anywhere in `assets/` or `content/`. That is a *syntax* rule,
not a platform one; modern browser APIs (`Math.imul`, `Object.keys`, `localStorage`,
`color-mix` in CSS) are already in use and are fine.

**Text reaches the DOM through `createTextNode` / `.textContent`, never `innerHTML`.** The
prose is ours, but keeping the rule means a future editing tool cannot introduce an
injection. Authored emphasis uses `*asterisks*` and is parsed into real `<em>` nodes by
`Ui.emphasise`.

**CSS** — every colour is a custom property declared twice: `:root` for dark, one
`[data-theme='light']` block. No hex values anywhere else. BEM-ish (`.card__title`).
Mobile-first. `--murk` is the one dynamic token, written by `Ui.applyMurk` from debt and
composure; it drives the tint, the transition pace and the text contrast, so a player who
keeps their numbers under control genuinely sees a less surreal game.

**Comments** — full sentences explaining *why*, only where a reader would otherwise be
puzzled. Match that density; do not narrate obvious code.

## Content

Beats live in `SCRIPT.beats`, one per month, keyed by `month`. A beat is
`{ id, chapter, month, kind, title, body[], note?, choices[] }`; `kind` is `situation`,
`opportunity` or `question`. A choice is
`{ id, label, hint?, requires?, hiddenWhen?, effects?, effectsLose?, flags?, tags?,
wager?, weight?, outcome | outcomeWin + outcomeLose }`.

- `requires` / `hiddenWhen` gate on stats (`{ composure: { min: 4 } }`) or flags
  (`{ disclosed: true }`). A gate naming something unknown fails closed.
- `tags` are `greed` (accrues exposure, engine applies nothing else) and `loan` (engine
  ratchets the rate).
- `flags` are one-way and must be in `State.FLAG_KEYS`.
- `weight` marks a pivotal choice for the "months that decided it" list; scenery gets none.
- Blank lines inside an outcome string become separate paragraphs.

**Numbers in prose are digits — cardinals and ordinals alike.** Quantities, money, times
and durations are figures (`€14,000`, `30 months`, `81 minutes`, `4 a.m.`), and so are
ordinals (`the 4th of the month`, `a 2nd van`, `the 1st page`). This is a game about
arithmetic, and the numbers should read as numbers rather than dissolve into the
sentence.

Only words that are not really figures stay as words: *once*, *twice*, *a single cent*,
*half a tray*. "One" used as an article or a pronoun is also a word, not a number — *he
holds one out to you*, *one Saturday*, *the one with the tiled walls*.

Keep this consistent when writing new beats.
