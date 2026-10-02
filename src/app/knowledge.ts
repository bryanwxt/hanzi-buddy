import { summarize, type Knowledge } from '../stats/stats';
import type { AppDb } from '../store/db';
import { allCards, allWords } from '../store/repo';

export type { Knowledge };

export async function loadKnowledge(db: AppDb): Promise<Knowledge> {
  const [words, cards] = await Promise.all([allWords(db), allCards(db)]);
  return summarize(words, cards);
}
