import { endOfLocalDay } from '../lib/date';
import { shuffle, type Rng } from '../lib/random';
import { isKnown } from '../srs/scheduler';
import type { CardKind, CardRecord, FlashItem, SessionPlan, Settings, StepKind, Word } from '../types';

export const REVIEW_CAP = 60;
export const BACKLOG_PAUSE = 40;
export const MAX_NEW_WRITE = 2;
export const FREE_PLAY_SIZE = 20;
export const STEP_ORDER: StepKind[] = ['flashcards', 'writing', 'components', 'speaking'];

const LAST = Number.MAX_SAFE_INTEGER;

/** Listed words first (oldest list first), then built-in words by rank. */
export function newWordOrder(a: Word, b: Word): number {
  return (a.listedAt ?? LAST) - (b.listedAt ?? LAST) || (a.rank ?? LAST) - (b.rank ?? LAST) || a.createdAt - b.createdAt;
}

export interface PlanInput {
  cards: CardRecord[];
  words: Word[];
  settings: Settings;
  now: Date;
  practised?: ReadonlyMap<string, number>; // words answered in lessons → when last; placement guesses aren't here
}

export function buildSessionPlan({ cards, words, settings, now, practised = new Map() }: PlanInput): SessionPlan {
  const active = words.filter((w) => !w.paused);
  const activeIds = new Set(active.map((w) => w.id));
  const cutoff = endOfLocalDay(now).getTime();
  const ofKind = (kind: CardKind) => cards.filter((c) => c.kind === kind);
  const dueOf = (list: CardRecord[]) =>
    list
      .filter((c) => activeIds.has(c.wordId) && c.fsrs.due.getTime() <= cutoff)
      .sort((a, b) => a.fsrs.due.getTime() - b.fsrs.due.getTime());

  const recognise = ofKind('recognise');
  const started = new Set(recognise.map((c) => c.wordId));
  const dueRecognise = dueOf(recognise);
  const newLimit = dueRecognise.length > BACKLOG_PAUSE ? 0 : settings.newPerDay;

  const write = ofKind('write');
  const hasWrite = new Set(write.map((c) => c.wordId));
  const knownIds = new Set(recognise.filter((c) => isKnown(c.fsrs)).map((c) => c.wordId));

  return {
    steps: STEP_ORDER.filter((s) => settings.activities[s]),
    reviewWordIds: dueRecognise.slice(0, REVIEW_CAP).map((c) => c.wordId),
    newWordIds: active.filter((w) => !started.has(w.id)).sort(newWordOrder).slice(0, newLimit).map((w) => w.id),
    flashTimeBoxMs: settings.sessionMinutes * 60_000 * 0.4,
    writeCandidates: [
      ...dueOf(write).map((c) => ({ wordId: c.wordId, isNew: false })),
      ...active
        .filter((w) => w.writeable && knownIds.has(w.id) && !hasWrite.has(w.id))
        .sort(
          (a, b) =>
            (a.writeSkippedAt ?? 0) - (b.writeSkippedAt ?? 0) || // strokes that failed to load go last
            (practised.get(b.id) ?? -1) - (practised.get(a.id) ?? -1) || // words from his lessons first, newest first
            (b.rank ?? -1) - (a.rank ?? -1) || // then placed characters near his level, going down
            newWordOrder(a, b),
        )
        .slice(0, MAX_NEW_WRITE)
        .map((w) => ({ wordId: w.id, isNew: true })),
    ],
    writeCount: settings.sessionMinutes < 25 ? 3 : 5,
  };
}

export function buildFreePlayQueue(cards: CardRecord[], words: Word[], rng: Rng, n = FREE_PLAY_SIZE): FlashItem[] {
  const active = new Set(words.filter((w) => !w.paused).map((w) => w.id));
  const ids = cards.filter((c) => c.kind === 'recognise' && active.has(c.wordId)).map((c) => c.wordId);
  return shuffle(ids, rng).slice(0, n).map((wordId) => ({ wordId, isNew: false, retry: true }));
}
