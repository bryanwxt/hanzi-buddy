import { describe, expect, it } from 'vitest';
import { average, LOUD_ENOUGH, quietFor, rmsLevel } from './loudness';
describe('loudness', () => {
  it('RMS of a signal', () => {
    expect(rmsLevel(new Float32Array([0, 0, 0, 0]))).toBe(0);
    expect(rmsLevel(new Float32Array([0.5, -0.5, 0.5, -0.5]))).toBeCloseTo(0.5);
    expect(average([])).toBe(0);
    expect(average([0.1, 0.3])).toBeCloseTo(0.2);
  });
  it('measures how long he has been too quiet', () => {
    const q = LOUD_ENOUGH / 2, l = LOUD_ENOUGH * 2;
    const series = [{ at: 0, level: l }, { at: 100, level: q }, { at: 1200, level: q }, { at: 2300, level: q }];
    expect(quietFor(series, 2300)).toBe(2200);
    expect(quietFor([...series, { at: 2400, level: l }], 2400)).toBe(0);
  });
});
