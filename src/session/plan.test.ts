import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../lib/random';
import { makeCard, makeWord } from '../test/fixtures';
import { DEFAULT_SETTINGS, type Settings } from '../types';
import { buildFreePlayQueue, buildSessionPlan } from './plan';

const now = new Date(2026, 9, 2, 8, 0);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const settings = (over: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...over });
const words = (n: number) => Array.from({ length: n }, (_, i) => makeWord(`字${i}`, { id: `b:${i}`, rank: i }));

describe('buildSessionPlan', () => {
  it('puts the most overdue reviews first and caps them at 60', () => {
    const ws = words(70);
    const cards = ws.map((w, i) => makeCard(w.id, 'recognise', hoursAgo(i + 1)));
    const plan = buildSessionPlan({ cards, words: ws, settings: settings(), now });
    expect(plan.reviewWordIds).toHaveLength(60);
    expect(plan.reviewWordIds[0]).toBe('b:69');
  });

  it('includes cards due later today but not tomorrow', () => {
    const cards = [makeCard('b:0', 'recognise', new Date(2026, 9, 2, 22)), makeCard('b:1', 'recognise', new Date(2026, 9, 3, 1))];
    expect(buildSessionPlan({ cards, words: words(2), settings: settings(), now }).reviewWordIds).toEqual(['b:0']);
  });

  it('introduces listed words first (oldest list first), then by rank, skipping paused and started words', () => {
    const ws = [
      makeWord('a', { id: 'b:a', rank: 0 }),
      makeWord('b', { id: 'b:b', rank: 1, paused: true }),
      makeWord('c', { id: 'b:c', rank: 2 }),
      makeWord('d', { id: 'b:d', rank: 3 }),
      makeWord('朋友', { id: 'p:1', source: 'parent', rank: null, level: null, listedAt: 50, createdAt: 50 }),
      makeWord('大', { id: 'b:大', rank: 400, listedAt: 10 }),
    ];
    const cards = [makeCard('b:c', 'recognise', new Date(2026, 9, 9))];
    const plan = buildSessionPlan({ cards, words: ws, settings: settings({ newPerDay: 3 }), now });
    expect(plan.newWordIds).toEqual(['b:大', 'p:1', 'b:a']);
  });

  it('pauses new words when more than 40 cards are due', () => {
    const ws = words(50);
    const due = (n: number) => ws.slice(0, n).map((w) => makeCard(w.id, 'recognise', hoursAgo(1)));
    expect(buildSessionPlan({ cards: due(41), words: ws, settings: settings(), now }).newWordIds).toEqual([]);
    expect(buildSessionPlan({ cards: due(40), words: ws, settings: settings(), now }).newWordIds).toHaveLength(5);
  });

  it('offers due write cards first, then at most 2 new ones for known writeable words', () => {
    const ws = words(6).map((w, i) => ({ ...w, writeable: i !== 4 }));
    const future = new Date(2026, 9, 20);
    const cards = [
      makeCard('b:0', 'write', hoursAgo(2)),
      ...[1, 2, 3, 4].map((i) => makeCard(`b:${i}`, 'recognise', future, true)),
      makeCard('b:5', 'recognise', future, false),
    ];
    expect(buildSessionPlan({ cards, words: ws, settings: settings(), now }).writeCandidates).toEqual([
      { wordId: 'b:0', isNew: false },
      { wordId: 'b:1', isNew: true },
      { wordId: 'b:2', isNew: true },
    ]);
  });

  it('sizes the writing step and the flashcard time box from session minutes', () => {
    const p20 = buildSessionPlan({ cards: [], words: [], settings: settings({ sessionMinutes: 20 }), now });
    expect([p20.writeCount, p20.flashTimeBoxMs]).toEqual([3, 8 * 60_000]);
    expect(buildSessionPlan({ cards: [], words: [], settings: settings({ sessionMinutes: 25 }), now }).writeCount).toBe(5);
  });

  it('only includes switched-on activities, in the fixed order', () => {
    const s = settings({ activities: { flashcards: true, writing: false, components: true, speaking: false } });
    expect(buildSessionPlan({ cards: [], words: [], settings: s, now }).steps).toEqual(['flashcards', 'components']);
  });
});

describe('buildFreePlayQueue', () => {
  it('uses started, active words only, as retries (no scheduler reviews)', () => {
    const ws = [makeWord('a', { id: 'b:a' }), makeWord('b', { id: 'b:b', paused: true }), makeWord('c', { id: 'b:c' })];
    const cards = [makeCard('b:a', 'recognise', now), makeCard('b:b', 'recognise', now)];
    expect(buildFreePlayQueue(cards, ws, mulberry32(1))).toEqual([{ wordId: 'b:a', isNew: false, retry: true }]);
  });
});
