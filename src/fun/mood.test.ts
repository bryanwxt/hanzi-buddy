import { createEmptyCard, State } from 'ts-fsrs';
import { describe, expect, it } from 'vitest';
import { closeupAllowed, isHardRecognition, isHardWrite, reactionMood, restingMood } from './mood';

describe('mood', () => {
  it('warms up with correct answers this session', () => {
    expect([0, 2, 3, 7, 8, 30].map(restingMood)).toEqual(['sulk', 'sulk', 'neutral', 'neutral', 'pleased', 'pleased']);
  });
  it('reacts: wow beats content beats nothing; wrong is side-eye', () => {
    expect(reactionMood({ correct: false, hard: true, combo: 0 })).toBe('side');
    expect(reactionMood({ correct: true, hard: true, combo: 5 })).toBe('wow');
    expect(reactionMood({ correct: true, hard: false, combo: 3 })).toBe('content');
    expect(reactionMood({ correct: true, hard: false, combo: 2 })).toBeNull();
  });
  it('knows a hard card', () => {
    const c = createEmptyCard(new Date(2026, 9, 2));
    expect(isHardRecognition(undefined)).toBe(false);
    expect(isHardRecognition(c)).toBe(false);
    expect(isHardRecognition({ ...c, state: State.Relearning })).toBe(true);
    expect(isHardRecognition({ ...c, state: State.Learning, reps: 1 })).toBe(false);
    expect(isHardRecognition({ ...c, state: State.Learning, reps: 2 })).toBe(true);
    expect(isHardWrite(true, 0)).toBe(true);
    expect(isHardWrite(true, 1)).toBe(false);
    expect(isHardWrite(false, 0)).toBe(false);
  });
  it('rations the close-up and never shows it with reduced motion', () => {
    expect(closeupAllowed(5, false)).toBe(true);
    expect(closeupAllowed(4, false)).toBe(false);
    expect(closeupAllowed(9, true)).toBe(false);
  });
});
