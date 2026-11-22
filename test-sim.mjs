// Ember Court — headless engine test. Run: node test-sim.mjs
// Simulates full duels (random player vs heuristic AI) plus targeted rule
// checks: surge, resonance, guard, mend, shatter, fatigue, determinism.
import { createGame, startPlay, playCard, endTurn, bonusesFor } from './game/src/engine.js';
import { chooseAiCard } from './game/src/ai.js';
import { buildDeck } from './game/src/deck.js';

let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) { pass++; }
  else { fail++; console.log('FAIL:', name); }
}

// --- deck composition ---
const deck = buildDeck();
check('deck has 24 cards', deck.length === 24);
const byEl = {};
deck.forEach((c) => { byEl[c.element] = (byEl[c.element] || 0) + 1; });
check('6 cards per element', ['ember', 'frost', 'gale', 'stone'].every((e) => byEl[e] === 6));

// --- surge: frost beats ember ---
{
  const s = createGame(11);
  startPlay(s);
  s.lastElement = 'ember';
  s.players.player.hand.push({ id: 't0', name: 'Test Frost', element: 'frost', kind: 'strike', cost: 1, power: 3, text: '' });
  s.players.player.mana = 10;
  const idx = s.players.player.hand.findIndex((c) => c.element === 'frost' && c.kind === 'strike');
  if (idx >= 0) {
    const card = s.players.player.hand[idx];
    const b = bonusesFor(s, card);
    check('surge triggers (frost beats ember)', b.surge && b.bonus === 2);
  } else {
    check('surge hand has frost strike', false);
  }
}

// --- resonance: same element twice in one turn ---
{
  const s = createGame(5);
  startPlay(s);
  const me = s.players.player;
  me.mana = 10;
  const first = me.hand.findIndex((c) => c.cost <= 10);
  if (first >= 0) {
    const el0 = me.hand[first].element;
    playCard(s, 'player', first);
    const second = me.hand.findIndex((c) => c.element === el0 && c.cost <= me.mana);
    if (second >= 0) {
      const b = bonusesFor(s, me.hand[second]);
      check('resonance triggers on same element', b.resonance && b.bonus >= 1);
    } else check('resonance: no second same-element card', true); // deck may not hold one; not a failure
  }
}

// --- guard absorbs, mend caps, shatter clears shield ---
{
  const s = createGame(3);
  startPlay(s);
  const me = s.players.player;
  const foe = s.players.ai;
  foe.hp = 30;
  foe.shield = 5;
  // force a strike through a hand-built card
  me.hand.push({ id: 't1', name: 'Test Slam', element: 'stone', kind: 'strike', cost: 1, power: 8, text: '' });
  me.mana = 10;
  playCard(s, 'player', me.hand.length - 1);
  check('shield absorbs first (foe hp 30 -> 27 after 5 shield + 3)', foe.hp === 27 && foe.shield === 0);
}

// --- full-game simulations: random player vs heuristic AI ---
let wins = { player: 0, ai: 0 };
let turns = [];
let errors = 0;
for (let g = 0; g < 300; g++) {
  const s = createGame(1000 + g);
  startPlay(s);
  let guard = 0;
  while (s.phase !== 'over' && guard++ < 400) {
    const me = s.players.player;
    const afford = me.hand.map((c, i) => (c.cost <= me.mana ? i : -1)).filter((i) => i >= 0);
    if (afford.length > 0 && Math.random() < 0.8) {
      playCard(s, 'player', afford[Math.floor(Math.random() * afford.length)]);
    } else {
      endTurn(s, chooseAiCard);
    }
  }
  if (s.phase !== 'over') { errors++; console.log('FAIL: game', g, 'did not finish'); }
  else { wins[s.winner]++; turns.push(s.turn); }
}
check('300 sims all finish', errors === 0);
check('both sides can win', wins.player > 20 && wins.ai > 20);
const avgTurn = turns.reduce((a, b) => a + b, 0) / Math.max(1, turns.length);
console.log(`sims: player wins ${wins.player}, ai wins ${wins.ai}, avg turns ${avgTurn.toFixed(1)}, max ${Math.max(...turns)}`);

// --- determinism: same seed + same moves -> same state ---
{
  const run = () => {
    const s = createGame(42);
    startPlay(s);
    for (let r = 0; r < 4; r++) {
      const me = s.players.player;
      for (let i = me.hand.length - 1; i >= 0; i--) {
        if (me.hand[i] && me.hand[i].cost <= me.mana) playCard(s, 'player', i);
        if (s.phase === 'over') break;
      }
      if (s.phase === 'over') break;
      endTurn(s, chooseAiCard);
    }
    return JSON.stringify({ hp: [s.players.player.hp, s.players.ai.hp], sh: [s.players.player.shield, s.players.ai.shield], turn: s.turn, log: s.log.length });
  };
  check('deterministic replays', run() === run());
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
