import { describe, expect, it } from 'vitest';
import { Rating, State } from 'ts-fsrs';
import { isKnown, newCard, review, seededKnownCard, toRating } from './scheduler';

const now = new Date(2026, 9, 2, 9, 0);

describe('toRating', () => {
  it('maps recognition answers', () => {
    expect(toRating({ kind: 'recognise', correct: false, responseMs: 500 })).toBe(Rating.Again);
    expect(toRating({ kind: 'recognise', correct: true, responseMs: 6000 })).toBe(Rating.Good);
    expect(toRating({ kind: 'recognise', correct: true, responseMs: 6001 })).toBe(Rating.Hard);
  });
  it('maps writing misses', () => {
    expect(toRating({ kind: 'write', totalMisses: 0 })).toBe(Rating.Good);
    expect(toRating({ kind: 'write', totalMisses: 1 })).toBe(Rating.Hard);
    expect(toRating({ kind: 'write', totalMisses: 3 })).toBe(Rating.Hard);
    expect(toRating({ kind: 'write', totalMisses: 4 })).toBe(Rating.Again);
  });
});

describe('review', () => {
  it('graduates a new card to known after two good reviews', () => {
    const first = review(newCard(now), Rating.Good, now);
    expect(first.due.getTime()).toBeGreaterThan(now.getTime());
    expect(isKnown(first)).toBe(false);
    const second = review(first, Rating.Good, first.due);
    expect(second.state).toBe(State.Review);
    expect(isKnown(second)).toBe(true);
  });
  it('a lapse makes a known card not known', () => {
    const known = seededKnownCard(now);
    expect(isKnown(review(known, Rating.Again, known.due))).toBe(false);
  });
});

describe('seededKnownCard', () => {
  it('is known and due in 14 days', () => {
    const c = seededKnownCard(now);
    expect(isKnown(c)).toBe(true);
    expect(c.due.getTime() - now.getTime()).toBe(14 * 86_400_000);
  });
  it('can be due on another day, with stability to match', () => {
    const c = seededKnownCard(now, 21);
    expect(c.due.getTime() - now.getTime()).toBe(21 * 86_400_000);
    expect(c.stability).toBe(21);
    expect(c.scheduled_days).toBe(21);
  });
  it('a good review at due date pushes it further out', () => {
    const c = seededKnownCard(now);
    const next = review(c, Rating.Good, c.due);
    expect(next.due.getTime() - c.due.getTime()).toBeGreaterThan(14 * 86_400_000);
  });
});
