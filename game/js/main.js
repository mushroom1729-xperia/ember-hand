import { createRenderer } from './render.js';
import { createAudioContext } from './audio.js';
import { createInput } from './input.js';
import { GameState } from './state.js';
import { CREATURE_CARDS } from './cards.js';
import { CreatureCard } from './state.js';
import { createAI } from './ai.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');

let screen = 'title';
let log = [];
let view = { x: 0, y: 0, scale: 1 };

// Parse screen from URL parameter
const urlScreen = new URLSearchParams(window.location.search).get('screen');
if (urlScreen && ['title', 'game', 'win', 'loss'].includes(urlScreen)) {
  screen = urlScreen;
} else {
  screen = 'title';
}

const renderer = createRenderer(canvas);
const audio = createAudioContext();
const input = createInput(canvas);

const gameState = new GameState();
const ai = createAI(gameState);

const turnInd = document.getElementById('turnInd');
const manaEl = document.getElementById('mana');
const playerLifeEl = document.getElementById('playerLife');
const opponentLifeEl = document.getElementById('opponentLife');
const endTurnBtn = document.getElementById('endTurnBtn');
const startBtn = document.getElementById('startBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const overlayWin = document.getElementById('overlayWin');
const overlayLoss = document.getElementById('overlayLoss');
const screenTitle = document.getElementById('screenTitle');
const screenGame = document.getElementById('screenGame');
const screenOverlays = document.getElementById('screenOverlays');

function showScreen(newScreen) {
  screen = newScreen;

  screenTitle.style.display = newScreen === 'title' ? 'block' : 'none';
  screenGame.style.display = newScreen === 'game' ? 'block' : 'none';

  // Show only the relevant overlay
  overlayWin.style.display = newScreen === 'win' ? 'block' : 'none';
  overlayLoss.style.display = newScreen === 'loss' ? 'block' : 'none';
  screenOverlays.style.display = (newScreen === 'win' || newScreen === 'loss') ? 'block' : 'none';

  // Show/hide title screen UI
  const uiTitle = document.querySelector('.ui.title');
  const uiSubtitle = document.querySelector('.ui.subtitle');
  const uiHowto = document.querySelector('.ui.howto');
  if (uiTitle) uiTitle.style.display = screen === 'title' ? 'block' : 'none';
  if (uiSubtitle) uiSubtitle.style.display = screen === 'title' ? 'block' : 'none';
  if (uiHowto) uiHowto.style.display = screen === 'title' ? 'block' : 'none';

  if (newScreen === 'title') {
    status.textContent = 'EMBER HAND - ready';
  } else if (newScreen === 'game') {
    status.textContent = 'Your turn - play your cards';
    gameState.reset();
    log = [];
    updateUI();

    // If started from ?screen=game, set up creatures in both columns and hand-heavy board
    if (urlScreen === 'game') {
      // Add creatures to player row (max 4)
      const playerCreatureCount = Math.min(3, CREATURE_CARDS.length);
      for (let i = 0; i < playerCreatureCount; i++) {
        const creature = new CreatureCard(CREATURE_CARDS[i]);
        gameState.creatures.player.push(creature);
      }
      // Add creatures to opponent row
      const opponentCreatureCount = Math.min(2, CREATURE_CARDS.length - playerCreatureCount);
      for (let i = 0; i < opponentCreatureCount; i++) {
        const creature = new CreatureCard(CREATURE_CARDS[playerCreatureCount + i]);
        gameState.creatures.opponent.push(creature);
      }
      // Deal more cards to hand
      gameState.hand = [];
      gameState._drawCards(5);
      gameState.aiHand = [];
      gameState._drawCards(3, false);
    }
  }
}

startBtn.addEventListener('click', () => {
  showScreen('game');
});

playAgainBtn.addEventListener('click', () => {
  showScreen('title');
});

playAgainBtn2.addEventListener('click', () => {
  showScreen('title');
});

function handleEndTurn() {
  if (gameState.gameOver) return;
  if (gameState.turn === 'player') {
    ai.takeTurn();
    renderer.drawScreen('game', gameState, log);
    audio.playAttack();
    checkGameState();
  }
}

function checkGameState() {
  if (gameState.gameOver) {
    if (gameState.winner === 'player') {
      showScreen('win');
      renderer.drawScreen('win', gameState, log);
      audio.playWin();
    } else {
      showScreen('loss');
      renderer.drawScreen('loss', gameState, log);
      audio.playLose();
    }
    return;
  }
  updateUI();
}

function updateUI() {
  turnInd.textContent = gameState.turn === 'player' ? 'Your turn' : 'AI turn';
  manaEl.innerHTML = ''.padStart(gameState.energy, '&#9679;') + ''.padStart(8 - gameState.energy, '&#9679;');
  playerLifeEl.textContent = '&#128152;'.repeat(Math.max(0, Math.min(5, gameState.life.player)));
  opponentLifeEl.textContent = '&#128152;'.repeat(Math.max(0, Math.min(5, gameState.life.opponent)));
}

canvas.addEventListener('click', (event) => {
  if (screen !== 'game') return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const worldX = (x - view.x) / view.scale;
  const worldY = (y - view.y) / view.scale;

  // Check hand clicks
  for (let i = 0; i < gameState.hand.length; i++) {
    const card = gameState.hand[i];
    const handX = 100 + i * 56;
    const handY = 380;
    if (worldX >= handX && worldX <= handX + 56 && worldY >= handY && worldY <= handY + 72) {
      gameState.playCard(i);
      renderer.drawScreen('game', gameState, log);
      audio.playAttack();
      checkGameState();
      return;
    }
  }

  // Check creature clicks
  for (let i = 0; i < gameState.creatures.player.length; i++) {
    const creature = gameState.creatures.player[i];
    const cx = 100 + i * 60;
    const cy = 460;
    if (worldX >= cx && worldX <= cx + 56 && worldY >= cy && worldY <= cy + 72) {
      gameState.startAttack(i);
      renderer.drawScreen('game', gameState, log);
      audio.playAttack();
      return;
    }
  }

  // Check end turn area
  if (worldY > 460 + 80 && worldY < 540 - 20) {
    handleEndTurn();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.code === 'Enter' && screen === 'title') {
    showScreen('game');
    event.preventDefault();
  }
  if (event.key.toLowerCase() === 't') showScreen('title');
  if (event.key.toLowerCase() === 'g') showScreen('game');
  if (event.key.toLowerCase() === 'w') showScreen('win');
  if (event.key.toLowerCase() === 'l') showScreen('loss');

  if (screen !== 'game') return;
  event.preventDefault();

  if (event.key >= '1' && event.key <= '9' && gameState.hand.length >= parseInt(event.key)) {
    const idx = parseInt(event.key) - 1;
    if (idx < gameState.hand.length) {
      gameState.playCard(idx);
      renderer.drawScreen('game', gameState, log);
      checkGameState();
    }
  }
  if (event.key === 'E') {
    handleEndTurn();
  }
});

// Resize handler to update view
window.addEventListener('resize', () => {
  const ratio = window.devicePixelRatio || 1;
  const canvasWidth = 960 * ratio;
  const canvasHeight = 540 * ratio;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  view.scale = Math.min(canvasWidth / 960, canvasHeight / 540);
  view.x = (canvasWidth - 960 * view.scale) / 2;
  view.y = (canvasHeight - 540 * view.scale) / 2;
});

// Initialize
showScreen(screen);
renderer.drawScreen('game', gameState, log);
updateUI();

requestAnimationFrame(function loop(now) {
  requestAnimationFrame(loop);
});