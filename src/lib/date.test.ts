import { describe, expect, it } from 'vitest';
import { addDays, endOfLocalDay, localDateKey, parseDateKey } from './date';

describe('date helpers', () => {
  it('formats local date keys with zero padding', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
  it('gives the last millisecond of the same local day', () => {
    const e = endOfLocalDay(new Date(2026, 9, 2, 8));
    expect([e.getDate(), e.getHours(), e.getMinutes(), e.getMilliseconds()]).toEqual([2, 23, 59, 999]);
  });
  it('adds days across month ends', () => {
    expect(localDateKey(addDays(new Date(2026, 9, 31), 1))).toBe('2026-11-01');
  });
  it('parses keys back to local midnight', () => {
    const d = parseDateKey('2026-10-02');
    expect(localDateKey(d)).toBe('2026-10-02');
    expect(d.getHours()).toBe(0);
  });
});
