# Underwater

A short game about debt, chance, and what you are willing to know about yourself.

You bought a refrigerated van to go independent. The round never quite worked, and now
you owe Luca "The Undertaker" fourteen thousand euros at four per cent a month. Thirty months, one
decision each, six endings.

## Playing it

Double-click `index.html`. That is the whole install — no server, no build, no
dependencies, and nothing is sent anywhere. The game runs from the filesystem because
content ships as a `<script>`-loaded JS file rather than JSON, which is the one thing
that would have required a server.

Keyboard: number keys pick a choice, Enter continues. Progress saves to `localStorage`,
so closing the tab mid-run is safe.

## The four things it argues, and how it argues them

The point of this game is that none of these are narrated at you. Each one is enforced
by arithmetic you can check, and all the numbers are in `assets/js/config.js`.

**Debt is unpayable.** You start in a position that is genuinely winnable: €14,000 at 4%
against an €800 monthly surplus clears in 31 months. The game is 30 months long. So the
honest grind very nearly works — and every missed payment and every new loan raises the
rate *permanently*, which is how it stops working. The ledger's "Clear by" line is the
whole argument: watch what one missed payment does to it.

**Gambling is risky.** Every bet is a real seeded roll returning **85 cents per euro
staked**, on average. The payout multiplier is authored per scene and the win probability
is derived from it, so the stated edge is always true. The true odds are printed on every
single bet, win or lose.

One exception, stated plainly: **the first bet in chapter one is scripted to win.** That
is not the game cheating in its favour — almost nobody's first bet loses, and a version
where it did would be a strawman. Every roll after it is the real thing.

**Don't be greedy.** Shortcuts pay immediately and well, and they are always the best
option on the numbers you can see. They accrue hidden exposure, which buys a rising
monthly chance that someone notices. Greed does not cost you less; it costs you later and
more.

**Accept who you are.** The best ending's condition does not look at your debt at all.
You can reach it still owing forty thousand euros, and you can clear the balance to zero
and land somewhere worse.

## Layout

```
index.html              the game
assets/css/main.css     all of the styling
assets/js/config.js     every tunable number
assets/js/lib/          the rules — rng, state, economy, wager, scenarios, endings
assets/js/ui.js         rendering
assets/js/main.js       the month loop
content/script.js       every word of prose and every effect value
tools/                  local-only, not part of the shipped game
```

`content/script.js` holds no logic and `assets/js/` holds no prose. You can rewrite the
entire script without touching a rule, or retune the entire economy without touching a
word.

## Working on it

Run `tools/checks.html` after every content edit. It validates the script against the
stat lists in `lib/state.js` — catching the failure mode this project cannot otherwise
see, where a mistyped effect key like `compsure` silently does nothing — and then plays
ten thousand headless runs under fixed strategies to check the four claims above against
the game's own arithmetic.

Some browsers refuse to run scripts from a `file://` URL, which makes `tools/checks.html`
awkward to open directly. If so:

```bash
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Serves the folder at <http://localhost:8080>; `-Port 8081` if that one is taken. The game
itself never needs this.

## Content note

This is a game about debt and despair. It does not depict self-harm, and it takes the
position that you can be alright without being solvent. If any of it lands close to home,
free debt counselling and insolvency advice exist in most countries and are worth more
than anything in here.
