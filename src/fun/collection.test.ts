import { describe, expect, it } from 'vitest';
import { BUILTIN, builtinWords } from '../content';
import { summarize } from '../stats/stats';
import { makeCard } from '../test/fixtures';
import { collectionCards, starsFor } from './collection';

describe('collection', () => {
  it('stars by memory strength', () => {
    expect([0.5, 6.9, 7, 29, 30, 200].map(starsFor)).toEqual([1, 1, 2, 2, 3, 3]);
  });
  it('one card per built-in character; caught, gold and rarity', () => {
    const rec = makeCard('b:河', 'recognise', new Date(2026, 9, 20), true);
    rec.fsrs = { ...rec.fsrs, stability: 40 };
    const wr = makeCard('b:河', 'write', new Date(2026, 9, 20), true);
    const cards = collectionCards(BUILTIN, summarize(builtinWords(0), [rec, wr]));
    expect(cards).toHaveLength(BUILTIN.length);
    expect(cards.find((c) => c.char === '河')).toMatchObject({ caught: true, stars: 3, gold: true, power: 'water' });
    expect(cards.find((c) => c.char === '大')).toMatchObject({ caught: false, stars: 0, gold: false });
    expect(new Set(cards.map((c) => c.rarity))).toEqual(new Set(['common', 'rare']));
  });
});
