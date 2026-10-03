// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { freshDb, makeCard, makeWord } from '../test/fixtures';
import { DEFAULT_SETTINGS, DEFAULT_KID } from '../types';
import {
  addRecording, addReviewLog, allCards, allWords, deleteWord, getKid, getSettings, listRecordings,
  logsSince, putCards, putWords, saveKid, seedBuiltinWords, updateSettings,
} from './repo';

describe('repo', () => {
  it('returns default settings and merges updates', async () => {
    const db = await freshDb();
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS);
    await updateSettings(db, { newPerDay: 7 });
    expect((await getSettings(db)).newPerDay).toBe(7);
    expect((await getSettings(db)).sessionMinutes).toBe(20);
  });

  it('seeds only missing built-in words and keeps existing flags', async () => {
    const db = await freshDb();
    await putWords(db, [makeWord('大', { paused: true })]);
    const added = await seedBuiltinWords(db, [makeWord('大'), makeWord('人')]);
    expect(added).toBe(1);
    const words = await allWords(db);
    expect(words.find((w) => w.text === '大')?.paused).toBe(true);
    expect(words).toHaveLength(2);
  });

  it('deleting a word removes its cards', async () => {
    const db = await freshDb();
    const now = new Date(2026, 9, 2);
    await putWords(db, [makeWord('大')]);
    await putCards(db, [makeCard('b:大', 'recognise', now), makeCard('b:大', 'write', now)]);
    await deleteWord(db, 'b:大');
    expect(await allCards(db)).toEqual([]);
  });

  it('keeps Date objects in cards', async () => {
    const db = await freshDb();
    const due = new Date(2026, 9, 5);
    await putCards(db, [makeCard('b:大', 'recognise', due)]);
    expect((await allCards(db))[0]!.fsrs.due).toBeInstanceOf(Date);
  });

  it('filters review logs by time', async () => {
    const db = await freshDb();
    await addReviewLog(db, { cardId: 'a', wordId: 'a', kind: 'recognise', at: 100, rating: Rating.Good, correct: true });
    await addReviewLog(db, { cardId: 'a', wordId: 'a', kind: 'recognise', at: 200, rating: Rating.Again, correct: false });
    expect((await logsSince(db, 150)).map((l) => l.at)).toEqual([200]);
  });

  it('lists recordings newest first with their audio intact', async () => {
    const db = await freshDb();
    const blob = (t: string) => new Blob([t], { type: 'audio/mp4' });
    await addRecording(db, { id: 'old', createdAt: 1, prompt: { kind: 'passage', passageId: 'p01' }, blob: blob('a'), mime: 'audio/mp4', durationSec: 3 });
    await addRecording(db, { id: 'new', createdAt: 2, prompt: { kind: 'passage', passageId: 'p02' }, blob: blob('bb'), mime: 'audio/mp4', durationSec: 4 });
    const list = await listRecordings(db);
    expect(list.map((r) => r.id)).toEqual(['new', 'old']);
    expect(await list[0]!.blob.text()).toBe('bb');
  });

  it('stores the kid state', async () => {
    const db = await freshDb();
    expect(await getKid(db)).toBeNull();
    await saveKid(db, { ...DEFAULT_KID, petName: '豆豆' });
    expect((await getKid(db))?.petName).toBe('豆豆');
  });
});

describe('seedBuiltinWords content updates', () => {
  it('refreshes built-in content on existing installs but keeps the parent and child state', async () => {
    const db = await freshDb();
    await putWords(db, [makeWord('兴', { pinyin: 'old', meaning: 'old', paused: true, listedAt: 5, listName: 'Week 1', createdAt: 1 })]);
    await seedBuiltinWords(db, [makeWord('兴', { pinyin: 'xìng', meaning: 'mood, interest', createdAt: 99 })]);
    const w = (await allWords(db))[0]!;
    expect([w.pinyin, w.meaning, w.paused, w.listedAt, w.listName, w.createdAt]).toEqual(['xìng', 'mood, interest', true, 5, 'Week 1', 1]);
  });
});

describe('normalizeKid', () => {
  it('fills new kid fields with defaults for dragon-era records', async () => {
    const db = await freshDb();
    await db.put('kid', { petName: '小龙', petColor: 'green', ownedAccessories: ['👑'], wearing: '👑', bonusStars: 2, lastChestDate: null, lastStageSeen: 3, badgesSeen: [] } as never, 'main');
    expect(await getKid(db)).toMatchObject({ wearing: 'medal', bonusStars: 2, activePower: null, powerTiersSeen: {} });
  });
});

describe('normalizeKid accessories v2', () => {
  it('maps old emoji accessories to the new ones and drops unknown values', async () => {
    const db = await freshDb();
    await db.put('kid', { ...DEFAULT_KID, ownedAccessories: ['👑', '🎓', 'x'], wearing: '🎓' } as never, 'main');
    expect(await getKid(db)).toMatchObject({ ownedAccessories: ['medal', 'brush'], wearing: 'brush' });
  });
});

describe('normalizeKid hardening', () => {
  it('does not crash on a malformed accessory list', async () => {
    const db = await freshDb();
    await db.put('kid', { ...DEFAULT_KID, ownedAccessories: null, wearing: 42 } as never, 'main');
    expect(await getKid(db)).toMatchObject({ ownedAccessories: [], wearing: null });
  });
});
