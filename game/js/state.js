import { SUITS, ELEMENTS, CREATURE_CARDS, SPELL_CARDS } from './cards.js';

export const START_LIFE = 20;
export const MAX_ENERGY = 8;
export const MAX_CREATURES = 4;
export const START_HAND = 3;

export class Card {
  constructor(definition) {
    this.definition = definition;
    this.name = definition.name;
    this.cost = definition.cost;
    this.type = definition.type;
    this.suit = definition.suit;
    this.elementColor = ELEMENTS[this.suit] || '#777';
    this.attack = definition.attack;
    this.health = definition.health;
    this.exhausted = false;
  }

  play() { return this.cost; }
}

export class CreatureCard extends Card {
  constructor(definition) {
    super(definition);
    this.currentAttack = definition.attack;
    this.currentHealth = definition.health;
  }

  takeDamage(amount) {
    this.currentHealth -= amount;
    if (this.currentHealth <= 0) this.currentHealth = 0;
    return this.currentHealth;
  }

  heal(amount) {
    this.currentHealth += amount;
    if (this.currentHealth > this.health) this.currentHealth = this.health;
  }
}

export class SpellCard extends Card {
  constructor(definition) {
    super(definition);
  }

  getAbility() {
    return this.definition.ability;
  }
}

export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.deck = [];
    this.hand = [];
    this.aiHand = [];
    this.creatures = { player: [], opponent: [] };
    this.life = { player: START_LIFE, opponent: START_LIFE };
    this.energy = 1;
    this.turn = 'player';
    this.gameOver = false;
    this.winner = null;
    this.selectedCreature = null;
    this.phase = 'beginning'; // beginning, main, combat
    this.attacker = null;
    this.target = null;
    this.log = [];

    this._buildDeck();
    this._drawCards(START_HAND);
    this._drawCards(START_HAND, false);
  }

  _buildDeck() {
    // Shuffle creature cards and spell cards together
    const creatures = [...CREATURE_CARDS].sort(() => Math.random() - 0.5);
    const spells = [...SPELL_CARDS].sort(() => Math.random() - 0.5);
    this.deck = [...creatures, ...spells];
  }

  _drawCards(count, isPlayer = true) {
    let life = isPlayer ? this.life.player : this.life.opponent;
    const hand = isPlayer ? this.hand : this.aiHand;
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        life -= 1;
        this.log.push(`Deck out! Lost 1 life. ${isPlayer ? 'Player' : 'AI'} life: ${life}`);
        if (life <= 0) this.endGame(isPlayer ? 'opponent' : 'player');
        // Update the actual life property
        if (isPlayer) this.life.player = life; else this.life.opponent = life;
        break;
      }
      const cardDef = this.deck.pop();
      if (cardDef.type === 'creature') {
        hand.push(new CreatureCard(cardDef));
      } else {
        hand.push(new SpellCard(cardDef));
      }
    }
  }

  endTurn() {
    if (this.gameOver) return;

    // Energy refills at start of turn
    this.energy = Math.min(MAX_ENERGY, this.energy + 1);

    // Draw card at end of turn (unless it's the AI's turn just passed)
    if (this.turn === 'player') {
      this._drawCards(1);
    }

    // Switch turns
    this.turn = this.turn === 'player' ? 'opponent' : 'player';

    // If it's now the player's turn again, check game over from deck-out
    if (this.turn === 'player' && this.life.player <= 0) {
      this.endGame('opponent');
    }

    this.log.push(`Turn: ${this.turn}, Energy: ${this.energy}`);
  }

  playCard(index) {
    if (this.gameOver) return;
    if (this.turn !== 'player') return;
    if (this.energy < this.hand[index].cost) return;

    const card = this.hand[index];
    if (card.type === 'creature') {
      return this._playCreature(index);
    } else {
      return this._playSpell(index);
    }
  }

  _playCreature(index) {
    const card = this.hand[index];
    const cost = card.cost;

    this.energy -= cost;

    // Remove from hand
    this.hand.splice(index, 1);

    // Put into player's row (max 4)
    if (this.creatures.player.length >= MAX_CREATURES) {
      this.energy += cost;
      this.hand.push(card);
      this.log.push('Row full! Card returned to hand.');
      return;
    }

    const creature = new CreatureCard(card.definition);
    this.creatures.player.push(creature);

    this.log.push(`Played ${card.name} (${card.attack}/${card.health})`);

    // Check if we can attack this turn (creatures can attack from next turn)
    // So newly played creatures cannot attack immediately

    // Draw replacement card
    this._drawCards(1);

    this.checkWin();

    return true;
  }

  _playSpell(index) {
    const card = this.hand[index];
    const cost = card.cost;

    this.energy -= cost;

    // Remove from hand (spells have immediate effect)
    this.hand.splice(index, 1);

    const ability = card.definition.ability;
    if (ability === 'damage') {
      const { target, amount } = card.definition.params;
      if (target === 'opponent') {
        this.life.opponent -= amount;
        this.log.push(`Dealt ${amount} damage to opponent. Life: ${this.life.opponent}`);
      } else if (target === 'creature') {
        // Damage a creature - find first opponent creature
        if (this.creatures.opponent.length > 0) {
          const victim = this.creatures.opponent[0];
          victim.takeDamage(amount);
          if (victim.currentHealth <= 0) {
            this.creatures.opponent.shift();
            this.log.push(`Creature destroyed!`);
          } else {
            this.log.push(`Dealt ${amount} damage to creature. Health: ${victim.currentHealth}`);
          }
        } else {
          this.life.opponent -= amount * 0.5; // Reduced damage to opponent
          this.log.push(`No creature target, dealt half damage to opponent: ${amount * 0.5}`);
        }
      }
    } else if (ability === 'heal') {
      const { amount, self } = card.definition.params;
      if (self) {
        this.life.player += amount;
        this.log.push(`Healed for ${amount}. Life: ${this.life.player}`);
      } else {
        // Heal a creature
        if (this.creatures.player.length > 0) {
          this.creatures.player[0].heal(amount);
          this.log.push(`Healed creature for ${amount}. Health: ${this.creatures.player[0].currentHealth}`);
        }
      }
    } else if (ability === 'draw') {
      const { count } = card.definition.params;
      this._drawCards(count);
    }

    this.checkWin();

    return true;
  }

  checkWin() {
    if (this.life.opponent <= 0) {
      this.endGame('player');
    } else if (this.life.player <= 0) {
      this.endGame('opponent');
    }
  }

  endGame(winner) {
    this.gameOver = true;
    this.winner = winner;
    this.log.push(`Game over! ${winner} wins!`);
  }

  startAttack(creatureIndex) {
    if (this.gameOver || this.turn !== 'player') return;
    const creature = this.creatures.player[creatureIndex];
    if (!creature) return;

    // Creature can attack if it's not exhausted and it's not a freshly played creature
    // In our simplified rules, creatures can attack right after being played
    // but we track with a flag - actually let's allow attack on same turn after declaration
    this.selectedCreature = creatureIndex;
    this.attacker = creature;
    this.log.push(`Selected ${this.attacker.definition.name} to attack`);
  }

  resolveAttack(target) {
    if (this.gameOver || this.turn !== 'player') return;
    if (!this.attacker) return;

    let damage = this.attacker.currentAttack;

    // Check if target is a creature
    let targetCreatureIndex = -1;
    for (let i = 0; i < this.creatures.opponent.length; i++) {
      if (this.creatures.opponent[i] === target || (target.definition && target.definition.name === this.creatures.opponent[i].definition.name)) {
        targetCreatureIndex = i;
        break;
      }
    }

    if (targetCreatureIndex >= 0) {
      // Target is an enemy creature
      const victim = this.creatures.opponent[targetCreatureIndex];
      const damageDealt = victim.takeDamage(damage);
      this.log.push(`Your ${this.attacker.definition.name} attacked ${victim.definition.name} for ${damage} damage. Health: ${victim.currentHealth}`);

      if (victim.currentHealth <= 0) {
        this.creatures.opponent.splice(targetCreatureIndex, 1);
        this.log.push(`Enemy creature destroyed!`);
      }

      // Simultaneous: opponent's creatures deal damage back if they survive
      this._simultaneousCombat(damage);
    } else {
      // Target is opponent life
      this.life.opponent -= damage;
      this.log.push(`Your ${this.attacker.definition.name} dealt ${damage} damage to opponent. Life: ${this.life.opponent}`);

      // Opponent's creatures deal damage back simultaneously
      this._simultaneousCombat(damage);
    }

    this.checkWin();

    // Reset selection
    this.attacker = null;
    this.selectedCreature = null;
  }

  _simultaneousCombat(damageDealtByPlayer) {
    // Opponent creatures deal damage to player life and creatures
    for (const creature of this.creatures.opponent) {
      // Calculate damage - creature attacks player life
      this.life.player -= creature.currentAttack;
      this.log.push(`Enemy ${creature.definition.name} dealt ${creature.currentAttack} damage to you. Life: ${this.life.player}`);

      // If player life drops to 0 or below, game over
      if (this.life.player <= 0) {
        this.endGame('opponent');
        return;
      }
    }
  }

  selectTarget(creatureIndex) {
    if (this.gameOver || this.turn !== 'player') return;
    this.target = creatureIndex;
  }

  completeAttack() {
    if (!this.attacker || !this.target || this.gameOver) return;
    this.resolveAttack(this.creatures.opponent[this.target]);
    this.target = null;
  }

  // AI methods
  aiPlayCard() {
    // Play affordable cards greedily
    for (let i = 0; i < this.hand.length; i++) {
      const card = this.hand[i];
      if (card.cost <= this.energy && card.type === 'creature' && this.creatures.opponent.length < MAX_CREATURES) {
        // Check if there's room
        if (this.creatures.opponent.length < MAX_CREATURES) {
          this._playCreatureAI(i);
          return true;
        }
      }
      if (card.cost <= this.energy && card.type === 'spell') {
        this._playSpellAI(i);
        return true;
      }
    }
    return false;
  }

  _playCreatureAI(index) {
    const card = this.hand[index];
    const cost = card.cost;

    this.energy -= cost;
    this.hand.splice(index, 1);

    const creature = new CreatureCard(card.definition);
    this.creatures.opponent.push(creature);

    this.log.push(`AI played ${card.name} (${creature.attack}/${creature.health})`);

    // AI may attack immediately if it can kill a player creature
    this._aiAttackIfPossible();

    this._drawCards(1);
    this.checkWin();

    // Switch back to player
    setTimeout(() => this.endTurn(), 800);
    return true;
  }

  _playSpellAI(index) {
    const card = this.hand[index];
    const cost = card.cost;

    this.energy -= cost;
    this.hand.splice(index, 1);

    const ability = card.definition.ability;
    if (ability === 'damage') {
      const { target, amount } = card.definition.params;
      if (target === 'opponent') {
        this.life.player -= amount;
        this.log.push(`AI cast ${card.name}, dealt ${amount} damage. Life: ${this.life.player}`);
      } else if (target === 'creature') {
        if (this.creatures.player.length > 0) {
          this.creatures.player[0].takeDamage(amount);
          if (this.creatures.player[0].currentHealth <= 0) {
            this.creatures.player.shift();
            this.log.push(`AI destroyed your creature!`);
          } else {
            this.log.push(`AI damaged your creature. Health: ${this.creatures.player[0].currentHealth}`);
          }
        }
      }
    } else if (ability === 'heal') {
      // AI heals itself
      this.life.opponent += amount;
      this.log.push(`AI healed for ${amount}. Life: ${this.life.opponent}`);
    }

    this.checkWin();

    setTimeout(() => this.endTurn(), 800);
    return true;
  }

  _aiAttackIfPossible() {
    // AI attacks: prefers killing player creatures it can survive, else hits player life
    // Find weakest player creature that AI creatures can kill
    for (const aiCreature of this.creatures.opponent) {
      // Check if there's a player creature weaker or equal
      for (const playerCreature of this.creatures.player) {
        if (playerCreature.currentHealth <= aiCreature.currentAttack) {
          // AI can kill this creature
          playerCreature.currentHealth = 0;
          // Remove from array
          const idx = this.creatures.player.indexOf(playerCreature);
          if (idx >= 0) this.creatures.player.splice(idx, 1);
          this.log.push(`AI ${aiCreature.definition.name} killed your ${playerCreature.definition.name}`);
          this.checkWin();
          return;
        }
      }
    }

    // Otherwise hit player life
    const totalAttack = this.creatures.opponent.reduce((sum, c) => sum + c.currentAttack, 0);
    if (totalAttack > 0) {
      this.life.player -= totalAttack;
      this.log.push(`AI creatures dealt ${totalAttack} damage to you. Life: ${this.life.player}`);
      this.checkWin();
    }
  }
}