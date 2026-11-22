// Ember Court — tuning and card definitions.
// One clear job: every number and name the game runs on lives here.

export const GAME_NAME = 'Ember Court';
export const MAX_HP = 30;
export const HAND_LIMIT = 7;
export const START_HAND = 4;
export const MAX_MANA = 10;
export const FATIGUE_DAMAGE = 2;
export const SURGE_BONUS = 2;
export const RESONANCE_BONUS = 1;

// Element wheel: each element beats exactly one other.
export const ELEMENTS = ['ember', 'frost', 'gale', 'stone'];
export const BEATS = { ember: 'gale', gale: 'stone', stone: 'frost', frost: 'ember' };

export const ELEMENT_STYLE = {
  ember: { label: 'Ember', color: '#e4572e', dark: '#8f2d12', glyph: '✦', glow: 'rgba(228,87,46,0.55)' },
  frost: { label: 'Frost', color: '#5bc0de', dark: '#1d6f8e', glyph: '❄', glow: 'rgba(91,192,222,0.55)' },
  gale: { label: 'Gale', color: '#7bc950', dark: '#3f7a1e', glyph: '≋', glow: 'rgba(123,201,80,0.55)' },
  stone: { label: 'Stone', color: '#d9a441', dark: '#8a6414', glyph: '⬢', glow: 'rgba(217,164,65,0.55)' },
};

// Card kinds: strike hurts, guard shields, mend heals, siphon hurts and heals,
// shatter breaks shields, insight draws.
export const KIND_TEXT = {
  strike: (p) => `Deal ${p} damage.`,
  guard: (p) => `Gain ${p} shield.`,
  mend: (p) => `Restore ${p} health.`,
  siphon: (p) => `Deal ${p} damage and restore ${p} health.`,
  shatter: (p) => `Break all enemy shield, then deal ${p} damage.`,
  insight: (p) => `Draw ${p} cards.`,
};

const NAME_STEM = {
  ember: { strike: 'Cinder Slash', guard: 'Ember Aegis', mend: 'Hearth Warmth', siphon: 'Pyre Siphon', shatter: 'Magma Crack', insight: 'Spark Vision' },
  frost: { strike: 'Rime Shard', guard: 'Glacier Wall', mend: 'Thaw Bloom', siphon: 'Chill Siphon', shatter: 'Ice Shatter', insight: 'Aurora Sight' },
  gale: { strike: 'Zephyr Cut', guard: 'Storm Veil', mend: 'Breeze Mend', siphon: 'Gale Siphon', shatter: 'Cyclone Break', insight: 'Wind Whisper' },
  stone: { strike: 'Granite Slam', guard: 'Bastion Rock', mend: 'Loam Mend', siphon: 'Ore Siphon', shatter: 'Quake Break', insight: 'Deep Sight' },
};

// [kind, cost, power, count] — the 24-card deck every duelist shuffles.
export const DECK_RECIPE = [
  ['strike', 1, 2, 6],
  ['strike', 2, 4, 4],
  ['strike', 3, 6, 2],
  ['guard', 1, 3, 4],
  ['guard', 2, 6, 2],
  ['mend', 2, 4, 2],
  ['mend', 3, 7, 1],
  ['siphon', 3, 3, 1],
  ['shatter', 3, 3, 1],
  ['insight', 1, 2, 1],
];

export function cardName(element, kind) {
  return NAME_STEM[element][kind];
}

export function cardText(kind, power) {
  return KIND_TEXT[kind](power);
}
