import { describe, expect, it } from 'vitest';
import type { RewardGoal } from '../types';
import { goalProgress, nextGoal } from './rewards';

const goal = (over: Partial<RewardGoal>): RewardGoal => ({
  id: 'g', title: 'Ice cream', emoji: '🍦', metric: 'stars', target: 100, createdAt: 0, claimedAt: null, ...over,
});

describe('reward goals', () => {
  it('measures stars or known characters against the target', () => {
    expect(goalProgress(goal({}), { stars: 40, known: 300 })).toEqual({ value: 40, fraction: 0.4, reached: false });
    expect(goalProgress(goal({ metric: 'known', target: 200 }), { stars: 0, known: 300 })).toEqual({ value: 300, fraction: 1, reached: true });
  });
  it('picks the oldest unclaimed goal', () => {
    const goals = [goal({ id: 'b', createdAt: 2 }), goal({ id: 'a', createdAt: 1, claimedAt: 5 }), goal({ id: 'c', createdAt: 3 })];
    expect(nextGoal(goals)?.id).toBe('b');
    expect(nextGoal([])).toBeNull();
  });
});
