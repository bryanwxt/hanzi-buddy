import { describe, expect, it } from 'vitest';
import { builtinWords } from '../content';
import { isKnown } from '../srs/scheduler';
import { bandSamples, PASS_AT, PER_BAND, placementBands, placementKnownIds, placementStep, seedPlacementCards, startPlacement } from './placement';

const words = builtinWords(0);
const now = new Date(2026, 9, 2, 9);
const bands = placementBands(words);
const run = (answers: boolean[]) => {
  let s = startPlacement();
  for (const ok of answers) {
    if (s.done) break;
    const w = bandSamples(bands[s.band]!)[s.index]!;
    s = placementStep(s, bands, ok, w.id);
  }
  return s;
};

describe('banded placement', () => {
  it('splits the built-ins into 10 bands of 60 and asks 8 evenly spaced from each', () => {
    expect(bands).toHaveLength(10);
    expect(bands.every((b) => b.length === 60)).toBe(true);
    const s = bandSamples(bands[0]!);
    expect(s).toHaveLength(PER_BAND);
    expect(s.map((w) => w.rank)).toEqual([0, 7, 15, 22, 30, 37, 45, 52]);
  });
  it('passes a band at 6 of 8 and moves on', () => {
    expect(PASS_AT).toBe(6);
    const s = run([true, true, true, true, true, true, false, false]);
    expect(s).toMatchObject({ band: 1, index: 0, wrong: 0, passed: [0], done: false });
  });
  it('stops at the 3rd miss in a band, crediting only that band’s right answers', () => {
    const s = run([...Array(8).fill(true), true, false, true, false, false]);
    expect(s.done).toBe(true);
    const ids = placementKnownIds(s, bands);
    const b1 = bandSamples(bands[1]!);
    expect(ids).toHaveLength(60 + 2);
    expect(ids).toContain(b1[0]!.id);
    expect(ids).toContain(b1[2]!.id);
    expect(ids).not.toContain(b1[1]!.id);
  });
  it('a child who knows nothing seeds nothing; one who knows everything seeds all', () => {
    const none = run([false, false, false]);
    expect(none.done).toBe(true);
    expect(placementKnownIds(none, bands)).toEqual([]);
    const all = run(Array(80).fill(true));
    expect(all.done).toBe(true);
    expect(placementKnownIds(all, bands)).toHaveLength(600);
  });
  it('seeds known cards for exactly the given words', () => {
    const cards = seedPlacementCards(words, [words[3]!.id, words[9]!.id], now);
    expect(cards.map((c) => c.wordId)).toEqual([words[3]!.id, words[9]!.id]);
    expect(cards.every((c) => isKnown(c.fsrs) && c.kind === 'recognise')).toBe(true);
  });
  it('spreads the first rechecks over days 7–28, hardest words first, so they never land on one day', () => {
    const known = bands.slice(0, 3).flat().map((w) => w.id); // 180 known words
    const cards = seedPlacementCards(words, known, now);
    const days = cards.map((c) => Math.round((c.fsrs.due.getTime() - now.getTime()) / 86_400_000));
    expect(Math.min(...days)).toBe(7);
    expect(Math.max(...days)).toBeLessThanOrEqual(28);
    const perDay = new Map<number, number>();
    for (const d of days) perDay.set(d, (perDay.get(d) ?? 0) + 1);
    expect(Math.max(...perDay.values())).toBeLessThanOrEqual(Math.ceil(180 / 22)); // well under the 40-review pause
    const dueOf = (id: string) => cards.find((c) => c.wordId === id)!.fsrs.due.getTime();
    expect(dueOf(known[known.length - 1]!)).toBeLessThan(dueOf(known[0]!)); // rank 180 is rechecked before rank 1
  });
});
