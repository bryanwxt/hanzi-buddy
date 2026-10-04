import type { AppDb } from '../store/db';
import { allCards, allWords, deleteCards, practisedWords, putCards, updateSettings } from '../store/repo';
import { seedPlacementCards } from './placement';

/** Saves a placement result. A re-run replaces the earlier placement: words known only by an earlier placement guess,
 *  never practised since, are cleared unless this result places them again. Words he has practised stay known. */
export async function applyPlacement(db: AppDb, knownIds: string[], now: Date): Promise<number> {
  const [words, cards, practised] = await Promise.all([allWords(db), allCards(db), practisedWords(db)]);
  const known = new Set(knownIds);
  const stale = cards.filter((c) => c.kind === 'recognise' && !known.has(c.wordId) && !practised.has(c.wordId)).map((c) => c.id);
  await deleteCards(db, stale);
  const existing = new Set(cards.map((c) => c.id));
  const seeds = seedPlacementCards(words, knownIds, now).filter((c) => !existing.has(c.id));
  await putCards(db, seeds);
  await updateSettings(db, { placementDone: true });
  return seeds.length;
}
