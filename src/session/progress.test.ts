import { describe, expect, it } from 'vitest';
import type { SessionPlan } from '../types';
import { sessionProgress } from './progress';
import { afterFlashAnswer, afterWriteWord, createSessionRecord, finishStep } from './runner';

const plan: SessionPlan = {
  steps: ['flashcards', 'writing'], reviewWordIds: ['a', 'b', 'c', 'd'], newWordIds: [],
  flashTimeBoxMs: 1_000_000, writeCandidates: [{ wordId: 'w', isNew: false }, { wordId: 'x', isNew: false }], writeCount: 2,
};

describe('sessionProgress', () => {
  it('starts at 0 and counts progress within the current step', () => {
    let rec = createSessionRecord(plan, 'd', 0);
    expect(sessionProgress(rec)).toBe(0);
    rec = afterFlashAnswer(rec, true, 10);
    expect(sessionProgress(rec)).toBeCloseTo(0.125);
    rec = finishStep(rec);
    expect(sessionProgress(rec)).toBe(0.5);
    rec = afterWriteWord(rec, true, 10);
    expect(sessionProgress(rec)).toBe(0.75);
  });
  it('uses the time box when it is further along than the card count', () => {
    const rec = { ...createSessionRecord({ ...plan, flashTimeBoxMs: 100 }, 'd', 0), flashElapsedMs: 50 };
    expect(sessionProgress(rec)).toBe(0.25);
  });
  it('is complete when the session is', () => {
    expect(sessionProgress(createSessionRecord({ ...plan, steps: [] }, 'd', 0))).toBe(1);
  });
});
