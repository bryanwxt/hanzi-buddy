import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CardRecord, KidState, PicturePrompt, Recording, ReviewLog, RewardGoal, SessionRecord, Settings, Word } from '../types';

export interface HanziDB extends DBSchema {
  words: { key: string; value: Word };
  cards: { key: string; value: CardRecord; indexes: { byWord: string } };
  reviewLogs: { key: number; value: ReviewLog; indexes: { byAt: number } };
  sessions: { key: string; value: SessionRecord };
  recordings: { key: string; value: Recording; indexes: { byCreatedAt: number } };
  prompts: { key: string; value: PicturePrompt };
  rewards: { key: string; value: RewardGoal };
  settings: { key: string; value: Settings };
  kid: { key: string; value: KidState };
}

export type AppDb = IDBPDatabase<HanziDB>;

export const DB_NAME = 'hanzi-buddy';
export const DB_VERSION = 1;

/** Stores holding one record per item (everything except the 'main' singletons). */
export const LIST_STORES = ['words', 'cards', 'reviewLogs', 'sessions', 'rewards', 'recordings', 'prompts'] as const;
export type ListStore = (typeof LIST_STORES)[number];

export function openAppDb(name: string = DB_NAME): Promise<AppDb> {
  return openDB<HanziDB>(name, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Each version step is applied in order; a thrown error aborts the upgrade and leaves the old data untouched.
      if (oldVersion < 1) {
        db.createObjectStore('words', { keyPath: 'id' });
        db.createObjectStore('cards', { keyPath: 'id' }).createIndex('byWord', 'wordId');
        db.createObjectStore('reviewLogs', { keyPath: 'id', autoIncrement: true }).createIndex('byAt', 'at');
        db.createObjectStore('sessions', { keyPath: 'date' });
        db.createObjectStore('recordings', { keyPath: 'id' }).createIndex('byCreatedAt', 'createdAt');
        db.createObjectStore('prompts', { keyPath: 'id' });
        db.createObjectStore('rewards', { keyPath: 'id' });
        db.createObjectStore('settings');
        db.createObjectStore('kid');
      }
    },
  });
}
