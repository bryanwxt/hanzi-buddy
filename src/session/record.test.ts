// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { allCards, allWords, getSession, logsSince, putWords, saveSession, updateSettings } from '../store/repo';
import { DEFAULT_SETTINGS } from '../types';
import { freshDb, makeWord } from '../test/fixtures';
import { markWriteSkipped, recordRecognition, recordWriting, startOrResumeSession } from './record';

const now = new Date(2026, 9, 2, 9);

describe('recording answers', () => {
  it('creates a card on the first answer and reviews it afterwards', async () => {
    const db = await freshDb();
    const first = await recordRecognition(db, 'b:大', { correct: true, responseMs: 1000 }, now);
    expect(first.id).toBe('b:大:recognise');
    const second = await recordRecognition(db, 'b:大', { correct: true, responseMs: 1000 }, new Date(first.fsrs.due.getTime() + 1000));
    expect(second.fsrs.reps).toBe(2);
    expect((await logsSince(db, 0)).map((l) => l.rating)).toEqual([Rating.Good, Rating.Good]);
  });

  it('records writing with its miss count', async () => {
    const db = await freshDb();
    await recordWriting(db, 'b:大', 2, now);
    const [log] = await logsSince(db, 0);
    expect(log).toMatchObject({ kind: 'write', misses: 2, rating: Rating.Hard, correct: true });
    expect((await allCards(db))[0]!.id).toBe('b:大:write');
  });
});

describe('startOrResumeSession', () => {
  it('resumes on the same day and starts fresh on a new day, keeping yesterday in history', async () => {
    const db = await freshDb();
    await putWords(db, [makeWord('大', { id: 'b:大' })]);
    const first = await startOrResumeSession(db, now);
    expect(first.plan.newWordIds).toEqual(['b:大']);
    await saveSession(db, { ...first, flashIndex: 1 });
    expect((await startOrResumeSession(db, new Date(2026, 9, 2, 18))).flashIndex).toBe(1);
    const tomorrow = await startOrResumeSession(db, new Date(2026, 9, 3, 9));
    expect(tomorrow.date).toBe('2026-10-03');
    expect(tomorrow.flashIndex).toBe(0);
    expect((await getSession(db, '2026-10-02'))?.flashIndex).toBe(1);
  });
});

describe('startOrResumeSession after a settings change', () => {
  it("rebuilds today's untouched plan so a parent's change applies today", async () => {
    const db = await freshDb();
    const now = new Date(2026, 9, 2, 8);
    expect((await startOrResumeSession(db, now)).plan.steps).toContain('writing');
    await updateSettings(db, { activities: { ...DEFAULT_SETTINGS.activities, writing: false } });
    expect((await startOrResumeSession(db, now)).plan.steps).not.toContain('writing');
  });
  it('keeps a plan the child has already started', async () => {
    const db = await freshDb();
    const now = new Date(2026, 9, 2, 8);
    const rec = await startOrResumeSession(db, now);
    await saveSession(db, { ...rec, activeMs: 5000 });
    await updateSettings(db, { activities: { ...DEFAULT_SETTINGS.activities, writing: false } });
    expect((await startOrResumeSession(db, now)).plan.steps).toContain('writing');
  });
});

describe('markWriteSkipped', () => {
  it('stamps the word so tomorrow offers other new words to write first', async () => {
    const db = await freshDb();
    await putWords(db, [makeWord('龘')]);
    await markWriteSkipped(db, 'b:龘', now);
    expect((await allWords(db))[0]?.writeSkippedAt).toBe(now.getTime());
  });
});
