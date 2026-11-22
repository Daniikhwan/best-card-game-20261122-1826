# Ember Court

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Daniikhwan/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Daniikhwan/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Ember Court** is an original elemental card duel for make.fun's "Make the best card game" bounty ($50 in USDC). You face the Cinder Warden across a green felt table: 30 health each, a 24-card deck, and a hand of elemental cards. First to 0 health wins.

## How it plays

- Each turn you gain mana (1, 2, 3 … up to 10) and draw a card, then play as many cards as you can afford before ending the turn.
- **Element wheel:** ✦ Ember beats ≋ Gale, ≋ Gale beats ⬢ Stone, ⬢ Stone beats ❄ Frost, ❄ Frost beats ✦ Ember. A card whose element beats the last card played **surges +2**.
- **Resonance:** a second card of the same element in one turn gets **+1**.
- Six card kinds: Strike, Guard, Mend, Siphon, Shatter (breaks all enemy shield), Insight (draw 2). An empty deck deals 2 fatigue per draw.
- The Warden plays a readable heuristic: it hunts lethal, guards when hurt, and re-scores every card after each play.

## Run it

```sh
node serve.ts
# open http://localhost:8080 — click a glowing card to play it, Enter ends the turn, M mutes
```

No build step, no network: `game/` is plain static files, and all sound is synthesized with WebAudio.

## Files

- `game/src/config.js` — elements, wheel, deck recipe, tuning
- `game/src/engine.js` — the pure rules (no DOM, seeded RNG)
- `game/src/ai.js` — the Warden's heuristic
- `game/src/deck.js` — deck building and drawing
- `game/src/render.js` — the table, cards and overlays
- `game/src/shots.js` — deterministic `?shot=` states for screenshots
- `game/src/main.js` — bootstrap and input
- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`

## Verify

```sh
node test-sim.mjs        # 300 headless duels + rule checks
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=vnsny7za&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
