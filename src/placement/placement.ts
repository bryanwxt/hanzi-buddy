import { seededKnownCard } from '../srs/scheduler';
import type { CardRecord, Word } from '../types';

export const PLACEMENT_SAMPLES = 40;

const builtinByRank = (words: Word[]) =>
  words.filter((w) => w.source === 'builtin' && w.rank !== null).sort((a, b) => a.rank! - b.rank!);

export function pickPlacementSamples(words: Word[], n = PLACEMENT_SAMPLES): Word[] {
  const ranked = builtinByRank(words);
  if (ranked.length <= n) return ranked;
  return Array.from({ length: n }, (_, i) => ranked[Math.floor((i * ranked.length) / n)]!);
}

/** Everything ranked before the first "don't know" counts as known. All known → everything. */
export function placementCutoff(samples: Word[], known: boolean[]): number {
  const firstUnknown = known.findIndex((k) => !k);
  return firstUnknown === -1 ? Number.MAX_SAFE_INTEGER : samples[firstUnknown]!.rank!;
}

export function seedPlacementCards(words: Word[], cutoffRank: number, now: Date): CardRecord[] {
  return builtinByRank(words)
    .filter((w) => w.rank! < cutoffRank)
    .map((w) => ({ id: `${w.id}:recognise`, wordId: w.id, kind: 'recognise' as const, fsrs: seededKnownCard(now) }));
}
