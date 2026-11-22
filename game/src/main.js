// Ember Court — bootstrap and input.
// One clear job: own the page. Build the state, wire the buttons and keys,
// step the Warden's turn out card by card so it reads, and hand every
// state change to the renderer with its sound.

import { createGame, startPlay, playCard, startAiTurn, aiPlayOne, finishAiTurn } from './engine.js';
import { chooseAiCard } from './ai.js';
import { render, shakeSide } from './render.js';
import { sfx, setMuted, isMuted } from './audio.js';
import { stateForShot } from './shots.js';

const root = document.getElementById('game');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '7');

let state = shot ? stateForShot(shot, seed) : createGame(seed);
let animating = false;

function playSounds(events) {
  for (const e of events) {
    if (e.type === 'damage') sfx.hit();
    else if (e.type === 'heal') sfx.heal();
    else if (e.type === 'guard') sfx.guard();
    else if (e.type === 'draw') sfx.draw();
    else if (e.type === 'play') {
      sfx.play();
      if (e.surge) sfx.surge();
    } else if (e.type === 'turn') sfx.turn();
  }
  if (state.phase === 'over') {
    if (state.winner === 'player') sfx.win();
    else sfx.loss();
  }
}

function draw() {
  render(state, root, callbacks);
}

const callbacks = {
  get muted() { return isMuted(); },
  onStart() {
    sfx.turn();
    startPlay(state);
    draw();
  },
  onRestart() {
    state = createGame((Math.random() * 1e9) | 0);
    animating = false;
    draw();
  },
  onMute() {
    setMuted(!isMuted());
    draw();
  },
  onPlayCard(index) {
    if (animating || state.phase !== 'play' || state.active !== 'player') return;
    const events = playCard(state, 'player', index);
    if (!events) return;
    playSounds(events);
    for (const e of events) {
      if (e.type === 'damage') shakeSide(root, 'ai');
    }
    draw();
  },
  onEndTurn() {
    if (animating || state.phase !== 'play') return;
    animating = true;
    startAiTurn(state);
    draw();
    // The Warden's cards land one at a time, 500 ms apart, so the turn reads.
    const tick = () => {
      if (state.phase === 'over') {
        // The killing blow already played the win/loss sound.
        animating = false;
        draw();
        return;
      }
      const played = aiPlayOne(state, chooseAiCard);
      if (played) {
        playSounds(played);
        shakeSide(root, 'player');
        draw();
        setTimeout(tick, 500);
      } else {
        finishAiTurn(state);
        sfx.turn();
        animating = false;
        draw();
      }
    };
    setTimeout(tick, 500);
  },
};

window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && state.phase === 'play' && !animating) callbacks.onEndTurn();
  if (event.key === 'm' || event.key === 'M') callbacks.onMute();
});

// A bad script error must be visible to a headless check, not silent.
window.addEventListener('error', (event) => {
  const node = document.createElement('div');
  node.id = 'page-error';
  node.textContent = String(event.message);
  document.body.appendChild(node);
});

draw();
