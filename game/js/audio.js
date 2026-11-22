export function createAudioContext() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  function playTone(frequency, duration, type = 'sine', volume = 0.1) {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.start(ctx.currentTime);
    gainNode.gain.value = volume;
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.stop(ctx.currentTime + duration);
  }

  function playClick() {
    playTone(440, 0.1, 'square', 0.1);
  }

  function playAttack() {
    playTone(220, 0.2, 'sine', 0.15);
    playTone(330, 0.1, 'sine', 0.1);
  }

  function playWin() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        playTone(392, 0.2, 'sine', 0.1);
        playTone(523, 0.2, 'sine', 0.1);
        playTone(659, 0.2, 'sine', 0.1);
      }, i * 200);
    }
  }

  function playLose() {
    playTone(147, 0.5, 'sine', 0.1);
    playTone(165, 0.3, 'sine', 0.1);
  }

  return { playClick, playAttack, playWin, playLose };
}