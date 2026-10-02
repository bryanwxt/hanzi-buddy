import type { RewardGoal } from '../types';

export interface GoalProgress {
  value: number;
  fraction: number;
  reached: boolean;
}

export function goalProgress(goal: RewardGoal, stats: { stars: number; known: number }): GoalProgress {
  const value = goal.metric === 'stars' ? stats.stars : stats.known;
  return { value, fraction: Math.min(1, value / goal.target), reached: value >= goal.target };
}

export function nextGoal(goals: RewardGoal[]): RewardGoal | null {
  return goals.filter((g) => g.claimedAt === null).sort((a, b) => a.createdAt - b.createdAt)[0] ?? null;
}
