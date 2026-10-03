import type { Recording } from '../types';
export function earnsBonus(prev: Pick<Recording, 'level' | 'durationSec'> | undefined, cur: { level: number; durationSec: number }): boolean {
  if (!prev) return false;
  if (cur.durationSec < prev.durationSec * 0.5) return false; // stopping straight away is not a quicker read
  const louder = typeof prev.level === 'number' && cur.level > prev.level;
  const quicker = prev.durationSec > 0 && cur.durationSec <= prev.durationSec * 0.9;
  return louder || quicker;
}
