export const KEY = {
  ENTER: 'Enter',
  T: 'KeyT',
  G: 'KeyG',
  W: 'KeyW',
  L: 'KeyL',
  ONE: 'Digit1',
  TWO: 'Digit2',
  THREE: 'Digit3',
  FOUR: 'Digit4',
  FIVE: 'Digit5',
  SIX: 'Digit6',
  SEVEN: 'Digit7',
  E: 'KeyE',
};

export function createInput(canvas) {
  let keys = {};
  let mouse = { x: 0, y: 0, down: false, clicked: false };
  let actions = 0;

  function handleKeyDown(event) {
    keys[event.code] = true;
    if (event.code === KEY.ENTER) actions |= 1; // ACTION_CONFIRM
    if (event.code === KEY.E) actions |= 2; // ACTION_END_TURN
    if (event.code === KEY.T) actions |= 4; // SCREEN_TITLE
    if (event.code === KEY.G) actions |= 8; // SCREEN_GAME
    if (event.code === KEY.W) actions |= 16; // SCREEN_WIN
    if (event.code === KEY.L) actions |= 32; // SCREEN_LOSS
    event.preventDefault();
  }

  function handleKeyUp(event) {
    keys[event.code] = false;
  }

  function handlePointerDown(event) {
    mouse.down = true;
    mouse.clicked = true;
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    event.preventDefault();
  }

  function handlePointerMove(event) {
    if (mouse.down) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    }
  }

  function handlePointerUp(event) {
    mouse.down = false;
    event.preventDefault();
  }

  function handleContextMenu(event) {
    event.preventDefault();
  }

  canvas.addEventListener('keydown', handleKeyDown);
  canvas.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('mousedown', handlePointerDown);
  canvas.addEventListener('mousemove', handlePointerMove);
  canvas.addEventListener('mouseup', handlePointerUp);
  canvas.addEventListener('contextmenu', handleContextMenu);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return {
    keys,
    get mouse() { return mouse; },
    getActions() { return actions; },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    onKeyDown(handler) {
      // Deprecated: use event listeners instead
    },
    onPointerDown(handler) {
      // Deprecated: use event listeners instead
    },
  };
}