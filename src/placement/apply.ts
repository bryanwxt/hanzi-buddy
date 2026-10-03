import type { AppDb } from '../store/db';
import { allCards, allWords, putCards, updateSettings } from '../store/repo';
import { seedPlacementCards } from './placement';

export async function applyPlacement(db: AppDb, knownIds: string[], now: Date): Promise<number> {
  const [words, cards] = await Promise.all([allWords(db), allCards(db)]);
  const existing = new Set(cards.map((c) => c.id));
  const seeds = seedPlacementCards(words, knownIds, now).filter((c) => !existing.has(c.id));
  await putCards(db, seeds);
  await updateSettings(db, { placementDone: true });
  return seeds.length;
}
