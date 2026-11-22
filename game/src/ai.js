// Ember Court — the Cinder Warden's brain.
// One clear job: pick the AI's next card. A readable heuristic, not a
// solver: it hunts lethal, guards when hurt, and otherwise plays the card
// worth the most right now, re-scored after every play so surges and
// resonances change its mind.

import { bonusesFor, playableIndexes } from './engine.js';

function scoreCard(state, card) {
  const me = state.players.ai;
  const foe = state.players.player;
  const { bonus } = bonusesFor(state, card);
  const power = card.power + bonus;
  switch (card.kind) {
    case 'strike':
      // Lethal is worth everything; otherwise damage is worth its face.
      if (power >= foe.hp + foe.shield) return 100 + power;
      return power;
    case 'shatter':
      if (power >= foe.hp + foe.shield) return 100 + power;
      return power + foe.shield * 0.5;
    case 'siphon':
      if (power >= foe.hp + foe.shield) return 100 + power;
      return power * 1.2 + (me.hp < me.maxHp ? power * 0.4 : 0);
    case 'guard': {
      const need = me.hp < 12 ? 1 : me.hp < 20 ? 0.6 : 0.3;
      return power * need;
    }
    case 'mend': {
      const missing = me.maxHp - me.hp;
      if (missing <= 0) return 0;
      return Math.min(power, missing) * (me.hp < 12 ? 1.2 : 0.7);
    }
    case 'insight':
      return me.hand.length < 4 ? 2.5 : 0.5;
    default:
      return 0;
  }
}

// Return the hand index the AI should play next, or null to end its turn.
export function chooseAiCard(state) {
  const indexes = playableIndexes(state, 'ai');
  if (indexes.length === 0) return null;
  let best = null;
  let bestScore = 1.0; // a card must beat doing nothing
  for (const i of indexes) {
    const card = state.players.ai.hand[i];
    const value = scoreCard(state, card) / card.cost;
    if (value > bestScore) {
      bestScore = value;
      best = i;
    }
  }
  return best;
}
