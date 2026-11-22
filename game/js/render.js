import { SUITS, ELEMENTS } from './cards.js';
import { MAX_ENERGY } from './state.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_GAME = 'game';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

const FIELD_W = 960;
const FIELD_H = 540;
const GROUND_Y = 500;
const CREATURE_ROW_Y = 460;
const HAND_Y = 380;
const OPPONENT_HAND_Y = 80;
const OPPONENT_CREATURE_ROW_Y = 120;
const LIFE_BAR_X = 30;
const OPPONENT_LIFE_BAR_X = 870;
const MANA_X = 30;
const OPPONENT_MANA_X = 870;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  let lastTime = 0;
  let deltaAccumulator = 0;
  const FIXED_STEP = 1 / 60;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const canvasWidth = FIELD_W * ratio;
    const canvasHeight = FIELD_H * ratio;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    view.scale = Math.min(canvasWidth / FIELD_W, canvasHeight / FIELD_H);
    view.x = (canvasWidth - FIELD_W * view.scale) / 2;
    view.y = (canvasHeight - FIELD_H * view.scale) / 2;
  }

  function worldToView(x, y) {
    return {
      x: view.x + x * view.scale,
      y: view.y + y * view.scale
    };
  }

  function drawRoundedRect(x, y, width, height, radius = 4, color) {
    const { x: vx, y: vy } = worldToView(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(vx + radius, vy);
    ctx.lineTo(vx + width - radius, vy);
    ctx.quadraticCurveTo(vx + width, vy, vx + width, vy + radius);
    ctx.lineTo(vx + width, vy + height - radius);
    ctx.quadraticCurveTo(vx + width, vy + height, vx + width - radius, vy + height);
    ctx.lineTo(vx + radius, vy + height);
    ctx.quadraticCurveTo(vx, vy + height, vx, vy + height - radius);
    ctx.lineTo(vx, vy + radius);
    ctx.quadraticCurveTo(vx, vy, vx + radius, vy);
    ctx.closePath();
    ctx.fill();
  }

  function drawText(text, x, y, size = 16, color = '#e8e8f0', align = 'left') {
    const { x: vx, y: vy } = worldToView(x, y);
    ctx.font = `${size}px system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, vx, vy);
  }

  function drawCardFace(card, x, y, faceUp = true, size = { w: 56, h: 72 }) {
    const { x: vx, y: vy } = worldToView(x, y);
    const cw = size.w * view.scale;
    const ch = size.h * view.scale;

    if (faceUp) {
      // Card background
      drawRoundedRect(vx, vy, cw, ch, 4, '#3d3d5f');

      // Suit/element glyph
      const color = ELEMENTS[card.suit] || '#777';
      ctx.fillStyle = color;
      ctx.font = `${Math.round(14 * view.scale)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';

      ctx.fillStyle = color;
      ctx.fillRect(vx + cw / 2 - 6, vy + 22 * view.scale, 12, 12);

      // Name
      drawText(card.name, vx + 4, vy + ch - 20, 10, '#e8e8f0', 'left');

      // Cost
      ctx.fillStyle = '#e84914';
      ctx.font = `${Math.round(12 * view.scale)}px system-ui, sans-serif`;
      ctx.fillText(`|${card.cost}|`, vx + cw - 4, vy + 16 * view.scale);

      // Attack/Health for creatures
      if (card.type === 'creature') {
        ctx.fillStyle = '#f5a623';
        ctx.font = `${Math.round(10 * view.scale)}px system-ui, sans-serif`;
        ctx.fillText(`ATK ${card.currentAttack || card.attack}`, vx + 4, vy + 24 * view.scale);
        ctx.fillText(`HP ${card.currentHealth || card.health}`, vx + 4, vy + 40 * view.scale);
      }
    } else {
      // Card back - simple design
      drawRoundedRect(vx, vy, cw, ch, 4, '#1a1a2a');
      ctx.fillStyle = '#444';
      ctx.fillText('★', vx + cw / 2, vy + 30 * view.scale);
      ctx.fillText('★', vx + cw / 2, vy + 50 * view.scale);
    }
  }

  function drawCreatureSlot(card, x, y, isOpponent = false, isSelected = false) {
    const color = isOpponent ? '#2a1a1a' : '#2a2a3a';
    const borderColor = isOpponent ? '#555' : '#444';
    const { x: vx, y: vy } = worldToView(x, y);
    const cw = 56 * view.scale;
    const ch = 72 * view.scale;

    drawRoundedRect(vx, vy, cw, ch, 4, color);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2 * view.scale;
    ctx.stroke();

    if (card) {
      // Name
      ctx.fillStyle = '#e8e8f0';
      ctx.font = `${Math.round(10 * view.scale)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(card.name, vx + cw / 2, vy + ch - 12 * view.scale);

      // Cost
      ctx.fillStyle = '#e84914';
      ctx.font = `${Math.round(10 * view.scale)}px system-ui, sans-serif`;
      ctx.fillText(`|${card.cost}|`, vx + cw - 4, vy + 8 * view.scale);

      // Attack
      ctx.fillStyle = '#f5a623';
      ctx.font = `${Math.round(10 * view.scale)}px system-ui, sans-serif`;
      ctx.fillText(`ATK ${card.currentAttack || card.attack}`, vx + 4, vy + ch - 28 * view.scale);

      // Health
      ctx.fillStyle = '#e8e8f0';
      ctx.font = `${Math.round(10 * view.scale)}px system-ui, sans-serif`;
      ctx.fillText(`HP ${card.currentHealth || card.health}`, vx + 4, vy + ch - 12 * view.scale);

      // Selection effect
      if (isSelected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3 * view.scale;
        ctx.strokeRect(vx + 2, vy + 2, cw - 4, ch - 4);
      }
    }
  }

  function drawLifeBar(life, maxLife, x, y, isOpponent = false) {
    const { x: vx, y: vy } = worldToView(x, y);
    const barWidth = 150 * view.scale;
    const barHeight = 20 * view.scale;
    const fillWidth = (life / maxLife) * barWidth;

    ctx.fillStyle = isOpponent ? '#3030c5' : '#c53030';
    ctx.fillRect(vx, vy, barWidth, barHeight);

    ctx.fillStyle = '#e8e8f0';
    ctx.fillRect(vx, vy, fillWidth, barHeight);

    const color = isOpponent ? '#ffd700' : '#fff';
    drawText(`${life}/${maxLife}`, vx + barWidth / 2, vy + barHeight / 2, 18, color, 'center');
  }

  function drawMana(energy, maxEnergy, x, y) {
    const { x: vx, y: vy } = worldToView(x, y);
    const orbSize = 14 * view.scale;
    const gap = 4 * view.scale;

    // Max energy orbs (empty)
    ctx.fillStyle = '#3a3a4a';
    for (let i = 0; i < maxEnergy; i++) {
      const ox = vx + i * (orbSize + gap);
      ctx.beginPath();
      ctx.arc(ox + orbSize / 2, vy + orbSize / 2, orbSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Current energy orbs (filled)
    ctx.fillStyle = '#f5a623';
    for (let i = 0; i < energy; i++) {
      const ox = vx + i * (orbSize + gap);
      ctx.beginPath();
      ctx.arc(ox + orbSize / 2, vy + orbSize / 2, orbSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBattleLog(log) {
    const logY = 40 * view.scale;
    const maxLines = 4;
    const lineHeight = 14 * view.scale;

    // Background
    ctx.fillStyle = 'rgba(10, 10, 15, 0.8)';
    ctx.fillRect(0, FIELD_H * view.scale - 80 * view.scale, FIELD_W * view.scale, 80 * view.scale);

    // Log entries
    ctx.fillStyle = '#e8e8f0';
    ctx.font = `${Math.round(12 * view.scale)}px system-ui, sans-serif`;
    ctx.textAlign = 'left';

    const start = Math.max(0, log.length - maxLines);
    for (let i = start; i < log.length; i++) {
      const line = log[i];
      const y = FIELD_H * view.scale - 60 * view.scale + (i - start) * lineHeight;
      ctx.fillText(line, 20 * view.scale, y);
    }
  }

  function drawScreen(screen, state, log) {
    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    if (screen === SCREEN_TITLE) {
      // Title screen
      drawText('EMBER HAND', FIELD_W / 2, 200, 48, '#ffd700', 'center');
      drawText('Click or press Enter to start', FIELD_W / 2, 300, 20, '#888', 'center');
    } else if (screen === SCREEN_GAME) {
      // Draw opponent side (top)
      // Opponent life
      drawLifeBar(state.life.opponent, 20, OPPONENT_LIFE_BAR_X, 30, true);

      // Opponent mana
      drawMana(state.energy, MAX_ENERGY, OPPONENT_MANA_X, 60);

      // Opponent creatures row
      for (let i = 0; i < state.creatures.opponent.length; i++) {
        const c = state.creatures.opponent[i];
        drawCreatureSlot(c, 100 + i * 60, OPPONENT_CREATURE_ROW_Y, true);
      }
      // Empty slots if less than 4
      for (let i = state.creatures.opponent.length; i < 4; i++) {
        drawCreatureSlot(null, 100 + i * 60, OPPONENT_CREATURE_ROW_Y, true);
      }

      // Player life
      drawLifeBar(state.life.player, 20, LIFE_BAR_X, 30);

      // Player mana
      drawMana(state.energy, MAX_ENERGY, MANA_X, 60);

      // Player hand
      for (let i = 0; i < state.hand.length; i++) {
        const card = state.hand[i];
        const isSelected = state.selectedCreature === i;
        drawCardFace(card, 100 + i * 56, HAND_Y, true, isSelected ? { w: 60, h: 78 } : { w: 56, h: 72 });
        // Cost badge
        ctx.fillStyle = '#e84914';
        ctx.fillRect((100 + i * 56 + 4) * view.scale, (HAND_Y + 4) * view.scale, 20 * view.scale, 16 * view.scale);
        ctx.fillStyle = 'white';
        ctx.font = `${Math.round(10 * view.scale)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${card.cost}`, (100 + i * 56 + 28) * view.scale, (HAND_Y + 12) * view.scale);
      }
      // Empty hand slots
      for (let i = state.hand.length; i < 7; i++) {
        drawCardFace(null, 100 + i * 56, HAND_Y, false);
      }

      // Player creatures row
      for (let i = 0; i < state.creatures.player.length; i++) {
        const c = state.creatures.player[i];
        const isSelected = state.selectedCreature === i;
        drawCreatureSlot(c, 100 + i * 60, CREATURE_ROW_Y, false, isSelected);
      }
      // Empty creature slots
      for (let i = state.creatures.player.length; i < 4; i++) {
        drawCreatureSlot(null, 100 + i * 60, CREATURE_ROW_Y, false);
      }

      // Battle log
      drawBattleLog(log || state.log);
    } else if (screen === SCREEN_WIN) {
      drawText('YOU WIN!', FIELD_W / 2, 200, 48, '#ffd700', 'center');
      drawText('Opponent life depleted', FIELD_W / 2, 300, 20, '#888', 'center');
      drawText('Press Play Again to continue', FIELD_W / 2, 380, 18, '#fff', 'center');
    } else if (screen === SCREEN_LOSS) {
      drawText('YOU LOSE', FIELD_W / 2, 200, 48, '#e84914', 'center');
      drawText('Opponent defeated you', FIELD_W / 2, 300, 20, '#888', 'center');
      drawText('Press Play Again to continue', FIELD_W / 2, 380, 18, '#fff', 'center');
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    deltaAccumulator += dt;

    while (deltaAccumulator >= FIXED_STEP) {
      deltaAccumulator -= FIXED_STEP;
    }

    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(loop);

  return { drawScreen, drawLifeBar, drawMana, drawBattleLog };
}