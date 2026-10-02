// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSessionRecord } from '../session/runner';
import { freshDb, makeCard, makeWord } from '../test/fixtures';
import { DEFAULT_KID } from '../types';
import { applyBackup, BACKUP_FORMAT, BackupError, exportBackup, exportRawBackup, readBackup } from './backup';
import { addRecording, allCards, getKid, getSettings, listRecordings, putCards, putWords, saveKid, saveSession, updateSettings } from './repo';

async function seeded() {
  const db = await freshDb();
  await putWords(db, [makeWord('大')]);
  await putCards(db, [makeCard('b:大', 'recognise', new Date(2026, 9, 5))]);
  await addRecording(db, {
    id: 'r1', createdAt: 1, prompt: { kind: 'passage', passageId: 'p01' },
    blob: new Blob(['hello'], { type: 'audio/mp4' }), mime: 'audio/mp4', durationSec: 2,
  });
  await updateSettings(db, { newPerDay: 8 });
  await saveKid(db, { ...DEFAULT_KID, petName: '豆豆' });
  await saveSession(db, createSessionRecord({ steps: [], reviewWordIds: [], newWordIds: [], flashTimeBoxMs: 0, writeCandidates: [], writeCount: 0 }, '2026-10-02', 0));
  return db;
}

describe('backup', () => {
  it('round-trips everything, including recordings and dates', async () => {
    const text = await exportBackup(await seeded(), { includeMedia: true, now: 1 });
    const preview = readBackup(text);
    expect(preview.counts).toEqual({ words: 1, cards: 1, sessions: 1, recordings: 1 });
    const target = await freshDb();
    await applyBackup(target, preview);
    expect((await allCards(target))[0]!.fsrs.due).toBeInstanceOf(Date);
    const [rec] = await listRecordings(target);
    expect(await rec!.blob.text()).toBe('hello');
    expect(rec!.blob.type).toBe('audio/mp4');
    expect((await getSettings(target)).newPerDay).toBe(8);
    expect((await getKid(target))?.petName).toBe('豆豆');
  });

  it('leaves existing recordings alone when the backup has no media', async () => {
    const text = await exportBackup(await seeded(), { includeMedia: false, now: 1 });
    expect(readBackup(text).hasMedia).toBe(false);
    const target = await seeded();
    await applyBackup(target, readBackup(text));
    expect(await listRecordings(target)).toHaveLength(1);
  });

  it('rejects files that are not backups, changing nothing', () => {
    expect(() => readBackup('not json')).toThrow('This file is not a 字己 ZiJi backup.');
    expect(() => readBackup('{"hello":1}')).toThrow(BackupError);
    expect(() => readBackup(JSON.stringify({ format: BACKUP_FORMAT, formatVersion: 1, stores: { words: 'x' } }))).toThrow(BackupError);
    expect(() => readBackup(JSON.stringify({ format: BACKUP_FORMAT, formatVersion: 1, stores: { secrets: [] } }))).toThrow(BackupError);
  });

  it('refuses backups from a newer app version', () => {
    expect(() => readBackup(JSON.stringify({ format: BACKUP_FORMAT, formatVersion: 99, stores: {} }))).toThrow(/newer version/);
  });

  it('makes an emergency raw dump of any database', async () => {
    const db = await seeded();
    const name = db.name;
    db.close();
    const dump = JSON.parse(await exportRawBackup(name));
    expect(dump.stores.words).toHaveLength(1);
    expect(dump.stores.settings[0].key).toBe('main');
  });
});
