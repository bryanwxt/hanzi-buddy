// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { builtinWords } from '../content';
import { isKnown } from '../srs/scheduler';
import { addReviewLog, allCards, getSettings, putCards, putWords } from '../store/repo';
import { freshDb, makeCard } from '../test/fixtures';
import { applyPlacement } from './apply';

describe('applyPlacement', () => {
  it('seeds missing cards, keeps existing ones, and marks placement done', async () => {
    const db = await freshDb();
    const now = new Date(2026, 9, 2, 9);
    const words = builtinWords(0).slice(0, 10);
    await putWords(db, words);
    await putCards(db, [makeCard(words[0]!.id, 'recognise', now)]);
    expect(await applyPlacement(db, words.slice(0, 5).map((w) => w.id), now)).toBe(4);
    const first = (await allCards(db)).find((c) => c.wordId === words[0]!.id)!;
    expect(isKnown(first.fsrs)).toBe(false);
    expect((await getSettings(db)).placementDone).toBe(true);
  });
  it('a re-run replaces the earlier placement: guesses it no longer supports are cleared, words he has practised stay known', async () => {
    const db = await freshDb();
    const now = new Date(2026, 9, 2, 9);
    const words = builtinWords(0).slice(0, 10);
    await putWords(db, words);
    await applyPlacement(db, words.map((w) => w.id), now); // first check: all 10 known
    await addReviewLog(db, { cardId: `${words[7]!.id}:recognise`, wordId: words[7]!.id, kind: 'recognise', at: now.getTime() + 1000, rating: 3, correct: true });
    await applyPlacement(db, words.slice(0, 2).map((w) => w.id), new Date(2026, 9, 4, 9)); // re-run fails early: 2 known
    expect((await allCards(db)).map((c) => c.wordId).sort()).toEqual([words[0]!.id, words[1]!.id, words[7]!.id].sort());
  });
});
