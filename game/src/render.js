// Ember Court — the table.
// One clear job: turn a game state into DOM. The engine never touches the
// screen; this module never touches the rules. Cards are plain divs so every
// value stays readable at thumbnail size.

import { ELEMENT_STYLE, MAX_HP } from './config.js';
import { bonusesFor } from './engine.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function manaCrystals(mana, maxMana) {
  const wrap = el('div', 'mana');
  for (let i = 0; i < 10; i++) {
    const gem = el('span', 'gem' + (i < mana ? ' on' : '') + (i < maxMana ? '' : ' dim'));
    gem.textContent = '◆';
    wrap.appendChild(gem);
  }
  return wrap;
}

function hpBar(duelist) {
  const wrap = el('div', 'hpbar');
  const fill = el('div', 'hpfill');
  fill.style.width = `${Math.max(0, (duelist.hp / duelist.maxHp) * 100)}%`;
  if (duelist.hp <= 10) fill.classList.add('low');
  wrap.appendChild(fill);
  const label = el('span', 'hplabel', `♥ ${Math.max(0, duelist.hp)} / ${duelist.maxHp}`);
  wrap.appendChild(label);
  if (duelist.shield > 0) {
    const shield = el('span', 'shield', `🛡 ${duelist.shield}`);
    wrap.appendChild(shield);
  }
  return wrap;
}

// One face-up card. `preview` is the surge/resonance bonus shown right now.
export function cardElement(state, side, card, index, callbacks) {
  const style = ELEMENT_STYLE[card.element];
  const node = el('div', `card el-${card.element}`);
  node.dataset.index = index;
  const { surge, resonance, bonus } = bonusesFor(state, card);
  const affordable = state.players[side].mana >= card.cost && state.active === side && state.phase === 'play';

  const cost = el('div', 'cost', String(card.cost));
  node.appendChild(cost);
  const glyph = el('div', 'glyph', style.glyph);
  node.appendChild(glyph);
  const name = el('div', 'cname', card.name);
  node.appendChild(name);
  const kind = el('div', 'ckind', `${style.label} · ${card.kind}`);
  node.appendChild(kind);
  const power = el('div', 'power', String(card.power + bonus));
  node.appendChild(power);
  const text = el('div', 'ctext', card.text);
  node.appendChild(text);
  if (surge) node.appendChild(el('div', 'badge surge', `SURGE +${bonus}`));
  else if (resonance) node.appendChild(el('div', 'badge resonance', `RESONANCE +${bonus}`));
  if (!affordable) node.classList.add('unaffordable');

  node.addEventListener('click', () => callbacks.onPlayCard(index));
  node.addEventListener('mouseenter', () => node.classList.add('hover'));
  node.addEventListener('mouseleave', () => node.classList.remove('hover'));
  return node;
}

export function cardBackElement() {
  const node = el('div', 'card back');
  node.appendChild(el('div', 'backglyph', '✦'));
  return node;
}

function handArea(state, side, callbacks) {
  const duelist = state.players[side];
  const wrap = el('div', `hand hand-${side}`);
  if (side === 'ai') {
    duelist.hand.forEach(() => wrap.appendChild(cardBackElement()));
    const count = el('div', 'handcount', `${duelist.hand.length} cards · ${duelist.deck.length} left`);
    wrap.appendChild(count);
  } else {
    duelist.hand.forEach((card, i) => {
      wrap.appendChild(cardElement(state, side, card, i, callbacks));
    });
  }
  return wrap;
}

function duelistPanel(state, side) {
  const duelist = state.players[side];
  const wrap = el('div', `duelist duelist-${side}`);
  const name = el('div', 'dname', side === 'ai' ? '🔥 Cinder Warden' : '⚔ You');
  wrap.appendChild(name);
  wrap.appendChild(hpBar(duelist));
  wrap.appendChild(manaCrystals(duelist.mana, duelist.maxMana));
  return wrap;
}

function arenaCard(state, side) {
  const played = state.lastPlay[side];
  const slot = el('div', `arenaslot arena-${side}`);
  if (!played) {
    slot.appendChild(el('div', 'arenawait', side === 'ai' ? 'Warden awaits…' : 'Your last card'));
    return slot;
  }
  const style = ELEMENT_STYLE[played.card.element];
  const mini = el('div', `minicard el-${played.card.element}`);
  mini.appendChild(el('div', 'miniglyph', style.glyph));
  mini.appendChild(el('div', 'mininames', played.card.name));
  mini.appendChild(el('div', 'minipower', String(played.power)));
  if (played.surge) mini.appendChild(el('div', 'badge surge', 'SURGE'));
  else if (played.resonance) mini.appendChild(el('div', 'badge resonance', 'RESONANCE'));
  slot.appendChild(mini);
  return slot;
}

function arena(state) {
  const wrap = el('div', 'arena');
  wrap.appendChild(arenaCard(state, 'ai'));
  const mid = el('div', 'arenamid');
  const wheel = el('div', 'wheel', '✦ beats ≋ · ≋ beats ⬢ · ⬢ beats ❄ · ❄ beats ✦');
  mid.appendChild(wheel);
  const last = state.log[state.log.length - 1];
  if (last) mid.appendChild(el('div', 'lastlog', last));
  const turn = el('div', 'turninfo', `Turn ${state.turn} · ${state.phase === 'ai' ? "Warden's move…" : 'Your move'}`);
  mid.appendChild(turn);
  wrap.appendChild(mid);
  wrap.appendChild(arenaCard(state, 'player'));
  return wrap;
}

function overlay(state, callbacks) {
  if (state.phase === 'title') {
    const ov = el('div', 'overlay title');
    ov.appendChild(el('div', 'bigtitle', 'EMBER COURT'));
    ov.appendChild(el('div', 'subtitle', 'An elemental duel of cards — outwit the Cinder Warden.'));
    const rules = el('div', 'rules');
    rules.innerHTML = 'First to 0 ♥ wins. Each turn gain mana and draw a card.<br>' +
      '✦ beats ≋, ≋ beats ⬢, ⬢ beats ❄, ❄ beats ✦ — a winning element surges +2.<br>' +
      'Two cards of one element in a turn resonate +1. Empty deck? 2 fatigue.';
    ov.appendChild(rules);
    const btn = el('button', 'bigbtn', '▶ Begin the Duel');
    btn.addEventListener('click', callbacks.onStart);
    ov.appendChild(btn);
    return ov;
  }
  if (state.phase === 'over') {
    const won = state.winner === 'player';
    const ov = el('div', 'overlay ' + (won ? 'win' : 'loss'));
    ov.appendChild(el('div', 'bigtitle', won ? '👑 VICTORY' : '💀 DEFEAT'));
    ov.appendChild(el('div', 'subtitle', won
      ? 'The Cinder Warden bows. The Ember Court is yours.'
      : 'The Warden takes the court… this time. Shuffle up and go again.'));
    const btn = el('button', 'bigbtn', '↻ Play Again');
    btn.addEventListener('click', callbacks.onRestart);
    ov.appendChild(btn);
    return ov;
  }
  return null;
}

// Rebuild the whole table from the state. Cheap at this size, and it keeps
// every label honest: nothing on screen is ever stale.
export function render(state, root, callbacks) {
  root.innerHTML = '';
  const table = el('div', 'table');
  table.appendChild(duelistPanel(state, 'ai'));
  table.appendChild(handArea(state, 'ai', callbacks));
  table.appendChild(arena(state));
  table.appendChild(handArea(state, 'player', callbacks));
  table.appendChild(duelistPanel(state, 'player'));

  const controls = el('div', 'controls');
  const endBtn = el('button', 'endbtn', 'End Turn ⏎');
  endBtn.disabled = state.phase !== 'play';
  endBtn.addEventListener('click', callbacks.onEndTurn);
  controls.appendChild(endBtn);
  const muteBtn = el('button', 'mutebtn', callbacks.muted ? '🔇 Sound off' : '🔊 Sound on');
  muteBtn.addEventListener('click', callbacks.onMute);
  controls.appendChild(muteBtn);
  const hint = el('div', 'hint', 'Click a glowing card to play it · Enter ends the turn');
  controls.appendChild(hint);
  table.appendChild(controls);

  root.appendChild(table);
  const ov = overlay(state, callbacks);
  if (ov) root.appendChild(ov);
  return table;
}

// A quick shake on the side that just took damage, so a hit reads.
export function shakeSide(root, side) {
  const panel = root.querySelector(`.duelist-${side}`);
  if (!panel) return;
  panel.classList.remove('shake');
  void panel.offsetWidth;
  panel.classList.add('shake');
}
