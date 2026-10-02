import { describe, expect, it } from 'vitest';
import { RADICALS } from '../../content/radicals';
import { mulberry32 } from '../../lib/random';
import { buildComponentRound, charHasComponent, type TapAllQuestion, type WhichPartQuestion } from './game';

const KNOWN = [...'河汉洗汽没喝吃叫吗呢他你们休大人口一二三好妈姐妹'];

describe('buildComponentRound', () => {
  it('needs at least 12 known characters', () => {
    expect(buildComponentRound(KNOWN.slice(0, 11), mulberry32(1))).toBeNull();
  });

  const round = buildComponentRound(KNOWN, mulberry32(7))!;

  it('builds 6 questions, alternating kinds', () => {
    expect(round).toHaveLength(6);
    expect(round.map((q) => q.kind)).toEqual(['tapAll', 'whichPart', 'tapAll', 'whichPart', 'tapAll', 'whichPart']);
  });

  it('tap-all questions have 2–4 correct fish in a grid of 8 distinct characters', () => {
    for (const q of round.filter((q): q is TapAllQuestion => q.kind === 'tapAll')) {
      expect(q.grid).toHaveLength(8);
      expect(new Set(q.grid).size).toBe(8);
      expect(q.answers.length).toBeGreaterThanOrEqual(2);
      expect(q.answers.length).toBeLessThanOrEqual(4);
      for (const c of q.grid) expect(charHasComponent(c, q.component)).toBe(q.answers.includes(c));
    }
  });

  it('which-part questions offer real parts with the answer exactly once', () => {
    for (const q of round.filter((q): q is WhichPartQuestion => q.kind === 'whichPart')) {
      expect(RADICALS[q.component]).toBeDefined();
      expect(q.options.filter((o) => o === q.component)).toHaveLength(1);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(charHasComponent(q.char, q.component)).toBe(true);
    }
  });
});
