export function createAI(state) {
  let energy = 1;

  return {
    takeTurn() {
      energy = 1;
      this._playGreedyCards();
      this._attackIfPossible();
      state.endTurn();
    },

    _playGreedyCards() {
      for (let i = 0; i < state.aiHand.length; i++) {
        const card = state.aiHand[i];
        if (card.cost <= energy && card.type === 'creature') {
          if (state.creatures.opponent.length < 4) {
            this._playCreature(i);
            return;
          }
        }
        if (card.cost <= energy && card.type === 'spell') {
          this._playSpell(i);
          return;
        }
      }
    },

    _playCreature: function(index) {
      const card = state.aiHand[index];
      const cost = card.cost;

      energy -= cost;
      state.aiHand.splice(index, 1);

      state.creatures.opponent.push({ ...card, currentHealth: card.health, currentAttack: card.attack });

      // Log the play
      state.log.push(`AI played ${card.name}`);

      // AI attacks after playing if possible
      this._attackIfPossible();

      // Draw replacement
      state._drawCards(1, false);
      state.checkWin();

      // Small delay then end turn
      setTimeout(() => state.endTurn(), 400);
    },

    _playSpell: function(index) {
      const card = state.aiHand[index];
      const cost = card.cost;

      energy -= cost;
      state.aiHand.splice(index, 1);

      const ability = card.definition.ability;
      if (ability === 'damage') {
        const { target, amount } = card.definition.params;
        if (target === 'opponent') {
          state.life.player -= amount;
          state.log.push(`AI cast ${card.name}, dealt ${amount} damage. Life: ${state.life.player}`);
        } else if (target === 'creature') {
          if (state.creatures.player.length > 0) {
            const victim = state.creatures.player[0];
            victim.currentHealth -= amount;
            if (victim.currentHealth <= 0) {
              const idx = state.creatures.player.indexOf(victim);
              if (idx >= 0) state.creatures.player.splice(idx, 1);
              state.log.push(`AI destroyed your creature!`);
            } else {
              state.log.push(`AI damaged your creature. Health: ${victim.currentHealth}`);
            }
          }
        }
      } else if (ability === 'heal') {
        const { amount, self } = card.definition.params;
        if (self) {
          state.life.opponent += amount;
          state.log.push(`AI healed for ${amount}. Life: ${state.life.opponent}`);
        }
      } else if (ability === 'draw') {
        const { count } = card.definition.params;
        state._drawCards(count, false);
      }

      state.checkWin();

      setTimeout(() => state.endTurn(), 400);
    },

    _attackIfPossible() {
      // AI attacks: prefers killing player creatures it can survive, else hits player life
      for (const aiCreature of state.creatures.opponent) {
        for (const playerCreature of state.creatures.player) {
          if (playerCreature.currentHealth <= aiCreature.currentAttack) {
            playerCreature.currentHealth = 0;
            const idx = state.creatures.player.indexOf(playerCreature);
            if (idx >= 0) state.creatures.player.splice(idx, 1);
            state.log.push(`AI ${aiCreature.name} killed your ${playerCreature.name}`);
            state.checkWin();
            return;
          }
        }
      }

      // Otherwise hit player life
      const totalAttack = state.creatures.opponent.reduce((sum, c) => sum + c.currentAttack, 0);
      if (totalAttack > 0) {
        state.life.player -= totalAttack;
        state.log.push(`AI creatures dealt ${totalAttack} damage to you. Life: ${state.life.player}`);
        state.checkWin();
      }
    },

    log: function(msg) {
      state.log.push(msg);
      if (state.log.length > 50) state.log.shift();
    }
  };
}