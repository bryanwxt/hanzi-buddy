import { migrateAccessory } from '../fun/accessories';
import { DEFAULT_KID, DEFAULT_SETTINGS, type CardRecord, type KidState, type PicturePrompt, type Recording, type ReviewLog, type RewardGoal, type SessionRecord, type Settings, type Word } from '../types';
import type { AppDb } from './db';

const MAIN = 'main';

export async function getSettings(db: AppDb): Promise<Settings> {
  const s = await db.get('settings', MAIN);
  return { ...DEFAULT_SETTINGS, ...s, activities: { ...DEFAULT_SETTINGS.activities, ...s?.activities } };
}

export async function saveSettings(db: AppDb, s: Settings): Promise<void> {
  await db.put('settings', s, MAIN);
}

export async function updateSettings(db: AppDb, patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings(db)), ...patch };
  await saveSettings(db, next);
  return next;
}

/** Older records (dragon era, older backups) lack newer fields: fill them with defaults. */
export function normalizeKid(raw: Partial<KidState> | null | undefined): KidState | null {
  if (!raw) return null;
  const kid = { ...DEFAULT_KID, ...raw };
  // Accessories v2: dragon-era emoji map one-to-one onto the new add-ons; unknown values are dropped.
  const list = Array.isArray(kid.ownedAccessories) ? kid.ownedAccessories : [];
  const owned = [...new Set(list.map((v) => migrateAccessory(typeof v === 'string' ? v : null)).filter((x): x is string => !!x))];
  return { ...kid, ownedAccessories: owned, wearing: migrateAccessory(typeof kid.wearing === 'string' ? kid.wearing : null) };
}

export async function getKid(db: AppDb): Promise<KidState | null> {
  return normalizeKid(await db.get('kid', MAIN));
}

export async function saveKid(db: AppDb, kid: KidState): Promise<void> {
  await db.put('kid', kid, MAIN);
}

export async function seedBuiltinWords(db: AppDb, words: Word[]): Promise<number> {
  const tx = db.transaction('words', 'readwrite');
  const existing = new Map((await tx.store.getAll()).map((w) => [w.id, w]));
  const missing = words.filter((w) => !existing.has(w.id));
  // Existing installs pick up content fixes; the parent's and child's state on each word is kept.
  const refreshed = words.flatMap((w) => {
    const old = existing.get(w.id);
    return old ? [{ ...w, paused: old.paused, listName: old.listName, listedAt: old.listedAt, createdAt: old.createdAt, writeSkippedAt: old.writeSkippedAt }] : [];
  });
  await Promise.all([...[...missing, ...refreshed].map((w) => tx.store.put(w)), tx.done]);
  return missing.length;
}

export const allWords = (db: AppDb) => db.getAll('words');
export const getWord = (db: AppDb, id: string) => db.get('words', id);

export async function putWords(db: AppDb, words: Word[]): Promise<void> {
  const tx = db.transaction('words', 'readwrite');
  await Promise.all([...words.map((w) => tx.store.put(w)), tx.done]);
}

export async function deleteWord(db: AppDb, id: string): Promise<void> {
  const tx = db.transaction(['words', 'cards'], 'readwrite');
  await Promise.all([
    tx.objectStore('words').delete(id),
    tx.objectStore('cards').delete(`${id}:recognise`),
    tx.objectStore('cards').delete(`${id}:write`),
    tx.done,
  ]);
}

export const allCards = (db: AppDb) => db.getAll('cards');
export const getCard = (db: AppDb, id: string) => db.get('cards', id);

export async function putCards(db: AppDb, cards: CardRecord[]): Promise<void> {
  const tx = db.transaction('cards', 'readwrite');
  await Promise.all([...cards.map((c) => tx.store.put(c)), tx.done]);
}

export async function addReviewLog(db: AppDb, log: ReviewLog): Promise<void> {
  const { id: _id, ...rest } = log;
  await db.add('reviewLogs', rest as ReviewLog);
}

export const logsSince = (db: AppDb, sinceMs: number) =>
  db.getAllFromIndex('reviewLogs', 'byAt', IDBKeyRange.lowerBound(sinceMs));

export const getSession = (db: AppDb, date: string) => db.get('sessions', date);
export const allSessions = (db: AppDb) => db.getAll('sessions');

export async function saveSession(db: AppDb, rec: SessionRecord): Promise<void> {
  await db.put('sessions', rec);
}

export async function addRecording(db: AppDb, r: Recording): Promise<void> {
  await db.put('recordings', r);
}

export async function listRecordings(db: AppDb): Promise<Recording[]> {
  return (await db.getAllFromIndex('recordings', 'byCreatedAt')).reverse();
}

export const deleteRecording = (db: AppDb, id: string) => db.delete('recordings', id);
export const countRecordings = (db: AppDb) => db.count('recordings');

export async function addPrompt(db: AppDb, p: PicturePrompt): Promise<void> {
  await db.put('prompts', p);
}

export async function listPrompts(db: AppDb): Promise<PicturePrompt[]> {
  return (await db.getAll('prompts')).sort((a, b) => a.createdAt - b.createdAt);
}

export const deletePrompt = (db: AppDb, id: string) => db.delete('prompts', id);

export async function listRewards(db: AppDb): Promise<RewardGoal[]> {
  return (await db.getAll('rewards')).sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveReward(db: AppDb, g: RewardGoal): Promise<void> {
  await db.put('rewards', g);
}

export const deleteReward = (db: AppDb, id: string) => db.delete('rewards', id);
