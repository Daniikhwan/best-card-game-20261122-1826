// Ember Court — tiny WebAudio sounds, no audio files.
// One clear job: bleeps for play, hit, heal, draw, win and loss, with a
// mute switch. Everything is synthesized; the game loads no media at all.

let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function tone(freq, ms, type = 'sine', gain = 0.08, when = 0) {
  if (muted) return;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + ms / 1000);
  } catch (_err) {
    // Audio is decoration; a browser without it still plays.
  }
}

export const sfx = {
  play() { tone(520, 90, 'triangle', 0.07); },
  draw() { tone(760, 60, 'sine', 0.05); },
  hit() { tone(180, 140, 'sawtooth', 0.09); tone(120, 180, 'square', 0.05, 0.02); },
  heal() { tone(660, 120, 'sine', 0.06); tone(880, 160, 'sine', 0.05, 0.08); },
  guard() { tone(300, 100, 'triangle', 0.07); },
  surge() { tone(980, 80, 'triangle', 0.06); tone(1240, 120, 'triangle', 0.05, 0.06); },
  turn() { tone(440, 70, 'sine', 0.05); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 180, 'triangle', 0.07, i * 0.12)); },
  loss() { [392, 330, 262, 196].forEach((f, i) => tone(f, 200, 'sine', 0.06, i * 0.13)); },
};
