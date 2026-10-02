// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { builtinWords } from '../content';
import { isKnown } from '../srs/scheduler';
import { allCards, getSettings, putCards, putWords } from '../store/repo';
import { freshDb, makeCard } from '../test/fixtures';
import { applyPlacement } from './apply';

describe('applyPlacement', () => {
  it('seeds missing cards, keeps existing ones, and marks placement done', async () => {
    const db = await freshDb();
    const now = new Date(2026, 9, 2, 9);
    const words = builtinWords(0).slice(0, 10);
    await putWords(db, words);
    await putCards(db, [makeCard(words[0]!.id, 'recognise', now)]);
    expect(await applyPlacement(db, 5, now)).toBe(4);
    const first = (await allCards(db)).find((c) => c.wordId === words[0]!.id)!;
    expect(isKnown(first.fsrs)).toBe(false);
    expect((await getSettings(db)).placementDone).toBe(true);
  });
});
