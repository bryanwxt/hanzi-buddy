export const LOUD_ENOUGH = 0.05; // RMS; tune on the iPad
export const QUIET_HINT_MS = 2000;
export function rmsLevel(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (const s of samples) sum += s * s;
  return Math.sqrt(sum / samples.length);
}
export const average = (levels: number[]) => (levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0);
export function quietFor(levels: { at: number; level: number }[], now: number): number {
  let since = now;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (levels[i]!.level >= LOUD_ENOUGH) break;
    since = levels[i]!.at;
  }
  return now - since;
}
