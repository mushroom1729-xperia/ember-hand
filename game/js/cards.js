export const SUITS = { EMBER: 'ember', FROST: 'frost', LEAF: 'leaf', STONE: 'stone' };
export const ELEMENTS = { ember: '#ff6b35', frost: '#48dbfb', leaf: '#6bda88', stone: '#94662b' };

export const CARD_DEFINITIONS = [
  { name: 'Ember Imp', cost: 1, type: 'creature', suit: SUITS.EMBER, attack: 1, health: 4, ability: null },
  { name: 'Ember Adept', cost: 1, type: 'creature', suit: SUITS.EMBER, attack: 2, health: 3, ability: null },
  { name: 'Frost Sprite', cost: 1, type: 'creature', suit: SUITS.FROST, attack: 1, health: 3, ability: null },
  { name: 'Stone Guardian', cost: 1, type: 'creature', suit: SUITS.STONE, attack: 2, health: 4, ability: null },
  { name: 'Leaf Druid', cost: 1, type: 'creature', suit: SUITS.LEAF, attack: 1, health: 3, ability: null },

  { name: 'Ember Elemental', cost: 2, type: 'creature', suit: SUITS.EMBER, attack: 3, health: 4, ability: null },
  { name: 'Frost Yeti', cost: 2, type: 'creature', suit: SUITS.FROST, attack: 3, health: 5, ability: null },
  { name: 'Stone Shaman', cost: 2, type: 'creature', suit: SUITS.STONE, attack: 4, health: 3, ability: null },
  { name: 'Leaf Ranger', cost: 2, type: 'creature', suit: SUITS.LEAF, attack: 3, health: 4, ability: null },

  { name: 'Ember Lord', cost: 3, type: 'creature', suit: SUITS.EMBER, attack: 5, health: 5, ability: null },
  { name: 'Frost Guardian', cost: 3, type: 'creature', suit: SUITS.FROST, attack: 4, health: 6, ability: null },
  { name: 'Stone Golem', cost: 3, type: 'creature', suit: SUITS.STONE, attack: 6, health: 6, ability: null },
  { name: 'Leafweaver', cost: 3, type: 'creature', suit: SUITS.LEAF, attack: 4, health: 5, ability: null },

  { name: 'Inferno', cost: 4, type: 'spell', suit: SUITS.EMBER, ability: 'damage', params: { target: 'creature', amount: 6 } },
  { name: 'Frostbite', cost: 4, type: 'spell', suit: SUITS.FROST, ability: 'damage', params: { target: 'creature', amount: 5, freeze: true } },
  { name: 'Earthquake', cost: 4, type: 'spell', suit: SUITS.STONE, ability: 'damage', params: { target: 'opponent', amount: 4 } },

  { name: 'Healing Fire', cost: 5, type: 'spell', suit: SUITS.EMBER, ability: 'heal', params: { amount: 6 } },
  { name: 'Rejuvenation', cost: 5, type: 'spell', suit: SUITS.LEAF, ability: 'heal', params: { amount: 6, draw: 1 } },
  { name: 'Draw Power', cost: 2, type: 'spell', ability: 'draw', params: { count: 2 } },

  { name: 'Meteor Strike', cost: 5, type: 'spell', suit: SUITS.EMBER, ability: 'damage', params: { target: 'opponent', amount: 8 } },
  { name: 'Frost Shield', cost: 3, type: 'spell', suit: SUITS.FROST, ability: 'heal', params: { amount: 4, self: true } },
].sort((a, b) => a.cost - b.cost || b.name.localeCompare(a.name));

export const CREATURE_CARDS = CARD_DEFINITIONS.filter(c => c.type === 'creature');
export const SPELL_CARDS = CARD_DEFINITIONS.filter(c => c.type === 'spell');