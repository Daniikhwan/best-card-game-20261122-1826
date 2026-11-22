// Ember Court — screenshot states.
// One clear job: build the exact table each screenshot shows, from a seed,
// by playing the engine forward. ?shot=title shows the title screen,
// ?shot=table a mid-duel table, ?shot=win the victory screen and
// ?shot=loss the defeat screen. No other code reads the query string.

import { createGame, startPlay, playCard, endTurn } from './engine.js';
import { chooseAiCard } from './ai.js';

export function stateForShot(shot, seed) {
  const state = createGame(seed);
  if (shot === 'title') return state;
  startPlay(state);
  if (shot === 'table') {
    // Play a few honest turns: the player spends what it can, the Warden
    // answers, until the table is busy and both sides are bruised.
    for (let round = 0; round < 3; round++) {
      const me = state.players.player;
      for (let i = me.hand.length - 1; i >= 0; i--) {
        if (me.hand[i] && me.hand[i].cost <= me.mana) playCard(state, 'player', i);
        if (state.phase === 'over') break;
      }
      if (state.phase === 'over') break;
      endTurn(state, chooseAiCard);
      if (state.phase === 'over') break;
    }
    return state;
  }
  if (shot === 'win') {
    state.players.ai.hp = 1;
    state.players.ai.shield = 0;
    const me = state.players.player;
    for (let i = 0; i < me.hand.length; i++) {
      const card = me.hand[i];
      if (card && (card.kind === 'strike' || card.kind === 'siphon' || card.kind === 'shatter') && card.cost <= me.mana) {
        playCard(state, 'player', i);
        break;
      }
    }
    if (state.phase !== 'over') {
      state.players.ai.hp = 0;
      state.phase = 'over';
      state.winner = 'player';
      state.log.push('You win the duel!');
    }
    return state;
  }
  if (shot === 'loss') {
    state.players.player.hp = 1;
    state.players.player.shield = 0;
    endTurn(state, chooseAiCard);
    if (state.phase !== 'over') {
      state.players.player.hp = 0;
      state.phase = 'over';
      state.winner = 'ai';
      state.log.push('The Cinder Warden wins.');
    }
    return state;
  }
  return state;
}
