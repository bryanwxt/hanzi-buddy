import { describe, expect, it } from 'vitest';
import { mulberry32, seedFromString, shuffle } from './random';

describe('random helpers', () => {
  it('mulberry32 repeats for the same seed and stays in [0, 1)', () => {
    const a = mulberry32(42), b = mulberry32(42);
    const xs = Array.from({ length: 5 }, () => a());
    expect(xs).toEqual(Array.from({ length: 5 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });
  it('shuffle keeps every item and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, mulberry32(1));
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
  it('seedFromString is stable and differs between strings', () => {
    expect(seedFromString('2026-10-02')).toBe(seedFromString('2026-10-02'));
    expect(seedFromString('2026-10-02')).not.toBe(seedFromString('2026-10-03'));
  });
});
