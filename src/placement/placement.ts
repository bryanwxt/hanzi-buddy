import { seededKnownCard } from '../srs/scheduler';
import type { CardRecord, Word } from '../types';

export const BAND_SIZE = 60;
export const PER_BAND = 8;
export const PASS_AT = 6; // so the 3rd miss in a band ends the check

const builtinByRank = (words: Word[]) =>
  words.filter((w) => w.source === 'builtin' && w.rank !== null).sort((a, b) => a.rank! - b.rank!);

/** Built-in characters in rank order, in bands of increasing difficulty. */
export function placementBands(words: Word[]): Word[][] {
  const ranked = builtinByRank(words);
  return Array.from({ length: Math.ceil(ranked.length / BAND_SIZE) }, (_, i) => ranked.slice(i * BAND_SIZE, (i + 1) * BAND_SIZE));
}

export function bandSamples(band: Word[], n = PER_BAND): Word[] {
  if (band.length <= n) return band;
  return Array.from({ length: n }, (_, i) => band[Math.floor((i * band.length) / n)]!);
}

export interface PlacementState {
  band: number;
  index: number; // question within the band
  wrong: number; // misses in this band
  right: string[]; // word ids answered right in this band
  passed: number[];
  done: boolean;
}

export const startPlacement = (): PlacementState => ({ band: 0, index: 0, wrong: 0, right: [], passed: [], done: false });

/** One answer. A band passes at PASS_AT right; the check stops at the miss that makes that impossible. */
export function placementStep(s: PlacementState, bands: Word[][], correct: boolean, wordId: string): PlacementState {
  if (s.done) return s;
  const asked = bandSamples(bands[s.band]!).length;
  const next = { ...s, index: s.index + 1, wrong: s.wrong + (correct ? 0 : 1), right: correct ? [...s.right, wordId] : s.right };
  if (asked - next.wrong < Math.min(PASS_AT, asked)) return { ...next, done: true };
  if (next.index < asked) return next;
  const passed = [...s.passed, s.band];
  if (s.band + 1 >= bands.length) return { ...next, passed, right: [], done: true };
  return { band: s.band + 1, index: 0, wrong: 0, right: [], passed, done: false };
}

/** Everything in passed bands, plus the characters answered right in the band where the check stopped. */
export function placementKnownIds(s: PlacementState, bands: Word[][]): string[] {
  return [...s.passed.flatMap((b) => bands[b]!.map((w) => w.id)), ...s.right];
}

export function seedPlacementCards(words: Word[], knownIds: string[], now: Date): CardRecord[] {
  const ids = new Set(knownIds);
  return words
    .filter((w) => ids.has(w.id))
    .map((w) => ({ id: `${w.id}:recognise`, wordId: w.id, kind: 'recognise' as const, fsrs: seededKnownCard(now) }));
}
