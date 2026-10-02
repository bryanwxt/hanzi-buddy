import { describe, expect, it } from 'vitest';
import { wordOfTheDay } from './wordOfDay';

describe('wordOfTheDay', () => {
  it("prefers today's first new single character", () => {
    expect(wordOfTheDay({ plannedNew: ['你好', '猫', '狗'], knownChars: new Set(['大']), date: '2026-10-02' })).toBe('猫');
  });
  it('otherwise picks a known character, stable for the day', () => {
    const known = new Set(['大', '小', '人', '口']);
    const a = wordOfTheDay({ plannedNew: [], knownChars: known, date: '2026-10-02' });
    expect(known.has(a!)).toBe(true);
    expect(wordOfTheDay({ plannedNew: [], knownChars: known, date: '2026-10-02' })).toBe(a);
  });
  it('is empty with nothing to show', () => {
    expect(wordOfTheDay({ plannedNew: [], knownChars: new Set(), date: '2026-10-02' })).toBeNull();
  });
});
