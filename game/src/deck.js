// Ember Court — deck building and drawing.
// One clear job: turn the recipe in config.js into shuffled decks and hands.

import { DECK_RECIPE, ELEMENTS, cardName, cardText } from './config.js';
import { shuffle } from './random.js';

let serial = 0;

// Build one 24-card deck. Elements cycle evenly through the recipe so each
// element appears the same number of times.
export function buildDeck() {
  const cards = [];
  let elementIndex = 0;
  for (const [kind, cost, power, count] of DECK_RECIPE) {
    for (let n = 0; n < count; n++) {
      const element = ELEMENTS[elementIndex % ELEMENTS.length];
      elementIndex++;
      cards.push({
        id: `c${++serial}`,
        name: cardName(element, kind),
        element,
        kind,
        cost,
        power,
        text: cardText(kind, power),
      });
    }
  }
  return cards;
}

export function freshDeck(rng) {
  return shuffle(buildDeck(), rng);
}

// Draw one card into a hand. Returns the drawn card, or null when the deck
// is empty (the caller then applies fatigue).
export function drawCard(player) {
  if (player.deck.length === 0) return null;
  if (player.hand.length >= 7) {
    player.deck.shift();
    return null;
  }
  const card = player.deck.shift();
  player.hand.push(card);
  return card;
}
