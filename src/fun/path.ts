import type { StepKind } from '../types';

export type PathKind = StepKind | 'chest';
export type NodeState = 'done' | 'current' | 'upcoming';

export interface PathNode {
  kind: PathKind;
  state: NodeState;
}

/** Today's path: one node per planned step, then the chest. Exactly one node is current until all are done. */
export function pathNodes(steps: StepKind[], completedSteps: StepKind[], chestOpened: boolean, todayCompleted: boolean): PathNode[] {
  const done = new Set(completedSteps);
  const nodes: PathNode[] = steps.map((kind) => ({ kind, state: done.has(kind) || todayCompleted ? 'done' : 'upcoming' }));
  nodes.push({ kind: 'chest', state: chestOpened ? 'done' : 'upcoming' });
  const current = todayCompleted ? (chestOpened ? undefined : nodes[nodes.length - 1]) : nodes.find((n) => n.kind !== 'chest' && n.state === 'upcoming');
  if (current) current.state = 'current';
  return nodes;
}
