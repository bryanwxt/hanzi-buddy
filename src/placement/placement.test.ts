import { describe, expect, it } from 'vitest';
import { builtinWords } from '../content';
import { isKnown } from '../srs/scheduler';
import { pickPlacementSamples, placementCutoff, seedPlacementCards } from './placement';

const words = builtinWords(0);
const now = new Date(2026, 9, 2, 9);

describe('placement', () => {
  it('picks 40 samples evenly across the built-in ranking', () => {
    const s = pickPlacementSamples(words);
    expect(s).toHaveLength(40);
    expect([s[0]!.rank, s[1]!.rank, s[39]!.rank]).toEqual([0, 15, 585]);
  });
  it('uses the rank of the first unknown sample as the cut-off', () => {
    const s = pickPlacementSamples(words);
    expect(placementCutoff(s.slice(0, 4), [true, true, true, false])).toBe(45);
    expect(placementCutoff(s.slice(0, 1), [false])).toBe(0);
    expect(placementCutoff(s, s.map(() => true))).toBe(Number.MAX_SAFE_INTEGER);
  });
  it('seeds known cards only below the cut-off', () => {
    const cards = seedPlacementCards(words, 45, now);
    expect(cards).toHaveLength(45);
    expect(cards.every((c) => isKnown(c.fsrs) && c.kind === 'recognise')).toBe(true);
    expect(cards[0]!.id).toBe(`${words[0]!.id}:recognise`);
  });
});
