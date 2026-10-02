export type Sfx = 'correct' | 'wrong' | 'combo' | 'star' | 'chest' | 'levelUp' | 'munch';

type Note = [freq: number, offset: number, duration: number, type?: OscillatorType];

// Short synthesized sounds; 'wrong' is deliberately soft and low, never a buzzer.
const NOTES: Record<Sfx, Note[]> = {
  correct: [[660, 0, 0.12], [880, 0.1, 0.18]],
  wrong: [[330, 0, 0.2, 'triangle']],
  combo: [[523, 0, 0.1], [659, 0.08, 0.1], [784, 0.16, 0.1], [1047, 0.24, 0.2]],
  star: [[1319, 0, 0.08], [1760, 0.06, 0.12]],
  chest: [[392, 0, 0.15], [523, 0.12, 0.15], [659, 0.24, 0.15], [784, 0.36, 0.3]],
  levelUp: [[523, 0, 0.15], [523, 0.15, 0.15], [784, 0.3, 0.15], [1047, 0.45, 0.4]],
  munch: [[180, 0, 0.06, 'square'], [150, 0.09, 0.06, 'square']],
};

let enabled = true;
let ctx: AudioContext | null = null;

export function setSfxEnabled(on: boolean): void {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled || typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function playSfx(name: Sfx): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  for (const [freq, offset, duration, type = 'sine'] of NOTES[name]) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, t + offset + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t + offset);
    osc.stop(t + offset + duration);
  }
}
