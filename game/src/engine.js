// Ember Court — the pure game engine.
// One clear job: the rules, and nothing about the screen. Every function
// here is a state transition; the renderer only reads the state and the
// events each transition returns. No DOM, no Math.random — the rng comes in.

import {
  MAX_HP, START_HAND, MAX_MANA, FATIGUE_DAMAGE,
  SURGE_BONUS, RESONANCE_BONUS, BEATS,
} from './config.js';
import { mulberry32 } from './random.js';
import { freshDeck, drawCard } from './deck.js';

function newDuelist(name) {
  return {
    name,
    hp: MAX_HP,
    maxHp: MAX_HP,
    shield: 0,
    mana: 0,
    maxMana: 0,
    deck: [],
    hand: [],
    discard: [],
  };
}

// Start a fresh duel. `seed` drives both decks so a replay is exact.
export function createGame(seed = 1) {
  const rng = mulberry32(seed);
  const state = {
    seed,
    rng,
    turn: 1,
    phase: 'title', // title | play | ai | over
    active: 'player',
    lastElement: null, // element of the last card played, either side
    chainElement: null, // element of the current turn's chain
    chainCount: 0,
    winner: null,
    log: [],
    players: {
      player: newDuelist('You'),
      ai: newDuelist('Cinder Warden'),
    },
    lastPlay: { player: null, ai: null },
  };
  for (const side of ['player', 'ai']) {
    const duelist = state.players[side];
    duelist.deck = freshDeck(rng);
    for (let i = 0; i < START_HAND; i++) drawCard(duelist);
  }
  return state;
}

export function startPlay(state) {
  state.phase = 'play';
  state.active = 'player';
  beginTurn(state, 'player');
  return [{ type: 'start', text: 'The duel begins — your move.' }];
}

function beginTurn(state, side) {
  const duelist = state.players[side];
  duelist.maxMana = Math.min(state.turn, MAX_MANA);
  duelist.mana = duelist.maxMana;
  state.chainElement = null;
  state.chainCount = 0;
  const drawn = drawCard(duelist);
  if (drawn === null && duelist.deck.length === 0) {
    duelist.hp -= FATIGUE_DAMAGE;
    state.log.push(`${duelist.name} draws from an empty deck and takes ${FATIGUE_DAMAGE} fatigue.`);
    checkWinner(state);
  }
}

// Bonuses for a card played right now: surge beats the last element played,
// resonance repeats the turn's chain element.
export function bonusesFor(state, card) {
  let surge = false;
  let resonance = false;
  let bonus = 0;
  if (state.lastElement && BEATS[card.element] === state.lastElement) {
    surge = true;
    bonus += SURGE_BONUS;
  }
  if (state.chainElement === card.element && state.chainCount >= 1) {
    resonance = true;
    bonus += RESONANCE_BONUS;
  }
  return { surge, resonance, bonus };
}

function dealDamage(state, target, amount) {
  const blocked = Math.min(target.shield, amount);
  target.shield -= blocked;
  const through = amount - blocked;
  target.hp -= through;
  return { blocked, through };
}

function heal(state, target, amount) {
  const healed = Math.min(target.maxHp - target.hp, amount);
  target.hp += healed;
  return healed;
}

// Play the card at handIndex for `side`. Returns the events the play made,
// or null when the card cannot be played (wrong phase, no mana, bad index).
export function playCard(state, side, handIndex) {
  if (state.phase === 'over') return null;
  if (state.active !== side) return null;
  const me = state.players[side];
  const foe = state.players[side === 'player' ? 'ai' : 'player'];
  const card = me.hand[handIndex];
  if (!card) return null;
  if (card.cost > me.mana) return null;

  me.mana -= card.cost;
  me.hand.splice(handIndex, 1);
  me.discard.push(card);
  const { surge, resonance, bonus } = bonusesFor(state, card);
  const power = card.power + bonus;
  const events = [{ type: 'play', side, card, surge, resonance, power }];

  if (card.kind === 'strike' || card.kind === 'siphon' || card.kind === 'shatter') {
    if (card.kind === 'shatter') {
      const broken = foe.shield;
      foe.shield = 0;
      events.push({ type: 'shatter', side, broken });
    }
    const hit = dealDamage(state, foe, power);
    events.push({ type: 'damage', side, amount: power, blocked: hit.blocked, through: hit.through });
    if (card.kind === 'siphon') {
      const healed = heal(state, me, power);
      events.push({ type: 'heal', side, amount: healed });
    }
  } else if (card.kind === 'guard') {
    me.shield += power;
    events.push({ type: 'guard', side, amount: power });
  } else if (card.kind === 'mend') {
    const healed = heal(state, me, power);
    events.push({ type: 'heal', side, amount: healed });
  } else if (card.kind === 'insight') {
    const drawn = [];
    for (let i = 0; i < power; i++) {
      const c = drawCard(me);
      if (c) drawn.push(c);
    }
    events.push({ type: 'draw', side, count: drawn.length });
  }

  state.lastElement = card.element;
  state.lastPlay[side] = { card, surge, resonance, power };
  if (state.chainElement === card.element) {
    state.chainCount += 1;
  } else {
    state.chainElement = card.element;
    state.chainCount = 1;
  }
  state.log.push(describePlay(state, side, card, surge, resonance, power));
  checkWinner(state);
  return events;
}

function describePlay(state, side, card, surge, resonance, power) {
  const who = state.players[side].name;
  let line = `${who} plays ${card.name} (${power}).`;
  if (surge) line += ' Surge!';
  if (resonance) line += ' Resonance!';
  return line;
}

// End `side`'s turn. The AI's whole turn is one call: it plays its cards
// (through the ai module's choose function) and then hands back.
export function endTurn(state, chooseAiCard) {
  if (state.phase === 'over') return [];
  const events = [{ type: 'endturn', side: state.active }];
  if (state.active === 'player') {
    state.active = 'ai';
    state.phase = 'ai';
    const aiEvents = aiTakeTurn(state, chooseAiCard);
    events.push(...aiEvents);
    if (state.phase !== 'over') {
      state.turn += 1;
      state.active = 'player';
      state.phase = 'play';
      beginTurn(state, 'player');
      events.push({ type: 'turn', turn: state.turn });
    }
  }
  return events;
}

function aiTakeTurn(state, chooseAiCard) {
  const events = [];
  beginTurn(state, 'ai');
  if (state.phase === 'over') return events;
  for (let guard = 0; guard < 12; guard++) {
    const index = chooseAiCard(state);
    if (index === null || index === undefined) break;
    const played = playCard(state, 'ai', index);
    if (!played) break;
    events.push(...played);
    if (state.phase === 'over') break;
  }
  events.push({ type: 'endturn', side: 'ai' });
  return events;
}

export function checkWinner(state) {
  if (state.phase === 'over') return;
  const player = state.players.player;
  const ai = state.players.ai;
  if (ai.hp <= 0 && player.hp <= 0) {
    state.winner = player.hp >= ai.hp ? 'player' : 'ai';
  } else if (ai.hp <= 0) {
    state.winner = 'player';
  } else if (player.hp <= 0) {
    state.winner = 'ai';
  } else {
    return;
  }
  state.phase = 'over';
  state.log.push(state.winner === 'player' ? 'You win the duel!' : 'The Cinder Warden wins.');
}

// Cards the active side can afford right now.
export function playableIndexes(state, side) {
  const me = state.players[side];
  const out = [];
  me.hand.forEach((card, i) => {
    if (card.cost <= me.mana) out.push(i);
  });
  return out;
}

// Steppable AI turn, for the screen: the Warden's cards land one at a time.
// startAiTurn opens the turn, aiPlayOne plays a single card (or null when
// the Warden is done), finishAiTurn hands the table back to the player.
// endTurn above keeps the same moves in one synchronous call, for shots and
// tests that do not animate.
export function startAiTurn(state) {
  if (state.phase === 'over') return [];
  state.active = 'ai';
  state.phase = 'ai';
  beginTurn(state, 'ai');
  return [{ type: 'turn', side: 'ai' }];
}

export function aiPlayOne(state, chooseAiCard) {
  if (state.phase !== 'ai') return null;
  const index = chooseAiCard(state);
  if (index === null || index === undefined) return null;
  const played = playCard(state, 'ai', index);
  if (!played) return null;
  return played;
}

export function finishAiTurn(state) {
  if (state.phase === 'over') return [];
  state.turn += 1;
  state.active = 'player';
  state.phase = 'play';
  beginTurn(state, 'player');
  return [{ type: 'turn', turn: state.turn }];
}
