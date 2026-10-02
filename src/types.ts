import type { Card as FsrsCard, Grade } from 'ts-fsrs';

export type { FsrsCard, Grade };

export type Level = 1 | 2 | 3;

export interface Example {
  text: string;
  pinyin: string;
}

/** One built-in character as stored in src/content/builtin.json. */
export interface BuiltinChar {
  char: string;
  pinyin: string;
  meaning: string;
  level: Level;
  rank: number;
  radical: string;
  components: string[];
  strokes: number;
  writeable: boolean;
  examples: Example[];
}

export interface CharInfo {
  char: string;
  radical: string;
  components: string[];
}

export interface Word {
  id: string; // 'b:<char>' built-in, 'p:<uuid>' parent-added
  text: string;
  pinyin: string; // tone-marked syllables separated by single spaces
  meaning?: string;
  level: Level | null;
  rank: number | null; // built-in order; null for parent words
  source: 'builtin' | 'parent';
  listName?: string;
  listedAt?: number; // set for parent words and built-in words pulled forward by a parent list
  writeable: boolean;
  paused: boolean;
  createdAt: number;
  examples?: Example[];
}

export type CardKind = 'recognise' | 'write';

export interface CardRecord {
  id: string; // `${wordId}:${kind}`
  wordId: string;
  kind: CardKind;
  fsrs: FsrsCard;
}

export interface ReviewLog {
  id?: number;
  cardId: string;
  wordId: string;
  kind: CardKind;
  at: number;
  rating: Grade;
  correct: boolean;
  responseMs?: number;
  misses?: number;
}

export type StepKind = 'flashcards' | 'writing' | 'components' | 'speaking';

export interface SessionPlan {
  steps: StepKind[];
  reviewWordIds: string[];
  newWordIds: string[];
  flashTimeBoxMs: number;
  writeCandidates: { wordId: string; isNew: boolean }[];
  writeCount: number;
}

export interface FlashItem {
  wordId: string;
  isNew: boolean;
  retry: boolean; // re-shown after a wrong answer (or free play): no scheduler review
}

export interface SessionRecord {
  date: string; // local YYYY-MM-DD the session started
  startedAt: number;
  activeMs: number;
  free: boolean; // free play: never saved, never reviewed by the scheduler
  plan: SessionPlan;
  stepIndex: number;
  flashQueue: FlashItem[];
  flashIndex: number;
  flashElapsedMs: number;
  writeIndex: number;
  writeDone: number;
  completedSteps: StepKind[];
  completed: boolean;
}

export type RecordingPrompt =
  | { kind: 'picture'; promptId: string }
  | { kind: 'passage'; passageId: string };

export interface Recording {
  id: string;
  createdAt: number;
  prompt: RecordingPrompt;
  blob: Blob;
  mime: string;
  durationSec: number;
}

export interface PicturePrompt {
  id: string;
  createdAt: number;
  blob: Blob;
  mime: string;
}

export interface Passage {
  id: string;
  title: string;
  text: string;
}

export interface Settings {
  pinHash: string | null;
  sessionMinutes: number;
  newPerDay: number;
  activities: Record<StepKind, boolean>;
  speechRate: number;
  soundEffects: boolean;
  targetRecognise: number;
  targetWrite: number;
  lastBackupAt: number | null;
  placementDone: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  pinHash: null,
  sessionMinutes: 20,
  newPerDay: 5,
  activities: { flashcards: true, writing: true, components: true, speaking: true },
  speechRate: 0.8,
  soundEffects: true,
  targetRecognise: 500,
  targetWrite: 150,
  lastBackupAt: null,
  placementDone: false,
};

export type PetColor = 'green' | 'blue' | 'purple' | 'red' | 'gold';

export interface KidState {
  petName: string;
  petColor: PetColor;
  ownedAccessories: string[];
  wearing: string | null;
  bonusStars: number;
  lastChestDate: string | null;
  lastStageSeen: number;
  badgesSeen: string[];
}

export const DEFAULT_KID: KidState = {
  petName: '小龙',
  petColor: 'green',
  ownedAccessories: [],
  wearing: null,
  bonusStars: 0,
  lastChestDate: null,
  lastStageSeen: 0,
  badgesSeen: [],
};

export interface RewardGoal {
  id: string;
  title: string;
  emoji: string;
  metric: 'stars' | 'known';
  target: number;
  createdAt: number;
  claimedAt: number | null;
}
