# 字己 Plan 8 — 朗读 coach + exam-etiquette warm-up — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The daily speaking step becomes a reading-aloud coach: an exam-etiquette warm-up, echo reading by phrase, a full read with a loudness meter, and listen-back stars. A passage repeats for 3 days. Parents add school texts, mark misread characters (which become priority words), and fill in the self-introduction details.

**Architecture:**
- **`src/langdu/`** holds pure logic:
  - phrase splitting;
  - the 3-day cycle;
  - the self-introduction script and its pinyin fading;
  - the bonus-star rule;
  - loudness maths.
- **`src/activities/langdu/LangduStep.tsx`** is the four-part UI, used by both the session and a new Home extra-round screen.
- **Data changes:**
  - parent passages live in a new IndexedDB store (DB v2), which backups include;
  - reading progress lives on `KidState.reading`;
  - the oral-exam fields live on `Settings.oral`.
- **The parent area** gets a 朗读 texts panel, misread marking in Recordings, the 口试 fields in Settings, and an opt-in speech-recognition test.

**Tech Stack:** Vite 7, Preact 10, TypeScript 5.9, idb, Vitest 4 (jsdom, fake-indexeddb), Web Audio (AnalyserNode), MediaRecorder, SpeechSynthesis.

**Spec:** `docs/superpowers/specs/2026-10-02-ziji-truffle-design.md` §16 (and §13 ink rules, §14 Label/pinyin).

## Global Constraints

- **The step id stays `speaking`.** The parent's activity toggle keeps working. `chooseSpeakingPrompt` is retired, and pictures leave the lesson until the story-builder plan.
- **Part order:** warm-up (daily step only) → echo → read all → listen back. Extra rounds from Home skip the warm-up, give no stars and don't count as cycle days.
- **Self-introduction (standard):** `老师好！我叫{name}。我今年{age}岁。我在{school}读{class}。` + after reading, `谢谢老师！`.
  - If any of name, age, school or class is empty, the warm-up is only `老师好！` … `谢谢老师！`.
  - A non-empty `customIntro` replaces the standard sentence block. 老师好！ and 谢谢老师！ stay.
- **Pinyin fading by warm-ups recorded:** 0–4 full; 5–9 only on characters not in `knownChars`; 10 or more, none.
- **Cycle:**
  - `CYCLE_DAYS = 3` practice days per passage;
  - `MAX_EXTRA = 2` extra days per passage (from confirmed misreads);
  - built-ins read in the last `RECENT_DAYS = 30` are skipped;
  - parent passages first, in the order added, then built-ins in list order, eligible by the existing 90%-known rule (`eligiblePassages`).
- **Stars:**
  - the step's normal star comes from `completedSteps`;
  - one bonus star (`kid.bonusStars += 1`) when this read was louder on average than the previous recording of the same passage, or at least 10% shorter;
  - no bonus on a passage's first recording.
- **Loudness:**
  - RMS of the time-domain signal, sampled every 100 ms;
  - `LOUD_ENOUGH = 0.05` (to be tuned on the iPad; keep it a single exported constant);
  - "大声一点！" ("a bit louder!") shows after `QUIET_HINT_MS = 2000` continuously below it;
  - never scored, never blocking.
- **Misreads:** confirming marks makes each marked character a priority word:
  - with a recognise card: due now;
  - otherwise the built-in word's `listedAt = now`.

  It also gives the passage one extra day, only while it is still the current passage.
- **Speech recognition is never on by default.** This plan ships an opt-in parent-area test only (see Task 8). It says plainly that the audio may go to Apple's speech service.
- **Privacy:** oral-exam fields stay in the local DB and backups. Never put the child's name in source or tests; use a placeholder like 小明.
- **Child-facing Chinese** goes through `Label`; there are no emoji on child screens. The parent area may use emoji.
- **Publishing:** never push or deploy without the parent's go-ahead in chat.

## Review Focus

1. **Microphone refused or unavailable:**
   - the warm-up and read-all parts show the existing "麦克风没有打开" note and let him continue;
   - echo still works;
   - the session finishes and no star is lost for the step.
2. **No passages at all** (no parent texts, and too few known characters for any built-in): the step is skipped as today, and the session completes.
3. **A parent edits or deletes the current passage mid-cycle:** the cycle moves on cleanly, with no crash and no ghost passage. Recordings of deleted passages still list in the parent area with a fallback title.
4. **Opening the app twice on the same day** (or doing an extra round, then the daily step): a cycle day counts at most once per date.
5. **Old data:**
   - a v1 database upgrades to v2 without losing anything;
   - a pre-plan-8 backup restores (with no `passages` store in it);
   - old `Settings` and `KidState` gain defaults;
   - old recordings without `level` don't break the bonus-star rule.

---

### Task 1: Data — passages store (DB v2), Settings.oral, KidState.reading, recording fields, backup

**Files:**
- Modify: `src/types.ts`, `src/store/db.ts`, `src/store/repo.ts`, `src/store/backup.ts`
- Test: `src/store/repo.test.ts`, `src/store/backup.test.ts`

**Interfaces:**
- Produces:

```ts
// types.ts
export interface ParentPassage { id: string; title: string; text: string; createdAt: number } // id 'pp:<uuid>'; text may hold '/' phrase marks
export interface OralInfo { name: string; age: string; school: string; className: string; customIntro: string }
export interface ReadingState { passageId: string | null; days: number; extra: number; lastDay: string | null; lastRead: Record<string, string>; warmups: number }
export type RecordingPrompt = { kind: 'picture'; promptId: string } | { kind: 'passage'; passageId: string } | { kind: 'intro' };
// Recording gains: level?: number (average RMS 0..1); misread?: string[] (confirmed characters)
// Settings gains: oral: OralInfo   (DEFAULT: all '')
// KidState gains: reading: ReadingState   (DEFAULT: { passageId: null, days: 0, extra: 0, lastDay: null, lastRead: {}, warmups: 0 })
// repo.ts
export async function listParentPassages(db: AppDb): Promise<ParentPassage[]>; // by createdAt
export async function saveParentPassage(db: AppDb, p: ParentPassage): Promise<void>;
export const deleteParentPassage: (db: AppDb, id: string) => Promise<void>;
export async function updateRecording(db: AppDb, r: Recording): Promise<void>;
```

- [ ] **Step 1: Failing tests** (`src/store/repo.test.ts`):

```ts
describe('plan 8 data', () => {
  it('stores parent passages in the order added', async () => {
    const db = await freshDb();
    await saveParentPassage(db, { id: 'pp:2', title: '乙', text: '我们去公园。', createdAt: 2 });
    await saveParentPassage(db, { id: 'pp:1', title: '甲', text: '我爱我家。', createdAt: 1 });
    expect((await listParentPassages(db)).map((p) => p.id)).toEqual(['pp:1', 'pp:2']);
    await deleteParentPassage(db, 'pp:1');
    expect((await listParentPassages(db)).map((p) => p.id)).toEqual(['pp:2']);
  });
  it('fills oral-exam fields and reading progress for old records', async () => {
    const db = await freshDb();
    await db.put('settings', { ...DEFAULT_SETTINGS, oral: undefined } as never, 'main');
    expect((await getSettings(db)).oral).toEqual({ name: '', age: '', school: '', className: '', customIntro: '' });
    expect(normalizeKid({ petName: '松露' } as never)?.reading).toEqual({ passageId: null, days: 0, extra: 0, lastDay: null, lastRead: {}, warmups: 0 });
    expect(normalizeKid({ reading: 'x' } as never)?.reading.warmups).toBe(0);
  });
});
```

`src/store/backup.test.ts`: a backup made before plan 8 restores, and parent passages round-trip:

```ts
it('restores a backup without a passages store, and round-trips parent passages', async () => {
  const src = await freshDb();
  await saveParentPassage(src, { id: 'pp:1', title: '甲', text: '我爱我家。', createdAt: 1 });
  const file = JSON.parse(await exportBackup(src)); // use the file's existing export/import helpers
  const target = await freshDb();
  await importBackup(target, JSON.stringify(file));
  expect((await listParentPassages(target)).map((p) => p.title)).toEqual(['甲']);
  delete file.stores.passages;
  const old = await freshDb();
  await importBackup(old, JSON.stringify(file));
  expect(await listParentPassages(old)).toEqual([]);
});
```

(Match the real helper names in `backup.ts`: check how `backup.test.ts` already exports and imports.)

- [ ] **Step 2: Run** `npx vitest run src/store`. Expected: FAIL (missing functions and fields).
- [ ] **Step 3: Implement.**
  - **`db.ts`:**
    - `DB_VERSION = 2`;
    - in `upgrade`, `if (oldVersion < 2) db.createObjectStore('passages', { keyPath: 'id' });`;
    - schema `passages: { key: string; value: ParentPassage }`;
    - add `'passages'` to `LIST_STORES`.
  - **`backup.ts`:** restore must accept files with no `passages` key: treat a missing list store as empty. Check the validation loop rejects only unknown store names; it does today, so a missing key is fine. Clear-and-write must not choke. Keep `BACKUP_FORMAT_VERSION` unless the format checker needs a bump.
  - **`repo.ts`:**
    - `getSettings` merges `oral` with defaults: `{ ...DEFAULT_SETTINGS.oral, ...(stored.oral ?? {}) }`;
    - `normalizeKid` validates `reading`: an object with numeric `days`, `extra` and `warmups`, a string-or-null `passageId` and `lastDay`, and an object `lastRead`; anything else becomes the default;
    - add the passage CRUD and `updateRecording` (`db.put('recordings', r)`).
  - **`types.ts`:** the fields above, plus defaults.
- [ ] **Step 4: Run** `npx vitest run src/store`, then `npm test`. Expected: green. (Tests comparing whole Settings or KidState objects get the new defaults.)
- [ ] **Step 5: Commit** `feat(langdu): data — parent passages store (db v2), oral-exam fields, reading progress`.

### Task 2: Pure reading logic (`src/langdu/`)

**Files:**
- Create: `src/langdu/phrases.ts`, `src/langdu/cycle.ts`, `src/langdu/intro.ts`, `src/langdu/stars.ts`, `src/langdu/loudness.ts`, plus a `*.test.ts` for each.

**Interfaces:**
- Consumes: `Passage`, `ParentPassage`, `ReadingState`, `OralInfo`, `Recording` (Task 1); `eligiblePassages` (`src/activities/speaking/prompts.ts`).
- Produces:

```ts
// phrases.ts
export function splitPhrases(text: string): string[];   // after ，。！？；：、 and at '/', punctuation kept on the left phrase, '/' dropped, blanks removed
export function displayText(text: string): string;      // text without '/'
// cycle.ts
export const CYCLE_DAYS = 3, MAX_EXTRA = 2, RECENT_DAYS = 30;
export interface ReadingPassage { id: string; title: string; text: string; source: 'parent' | 'builtin' }
export function readingPool(parent: ParentPassage[], builtins: Passage[], knownChars: Set<string>): ReadingPassage[]; // parent first (by createdAt), then eligible built-ins
export function pickPassage(r: ReadingState, pool: ReadingPassage[], today: string): ReadingPassage | null;
export function finishDay(r: ReadingState, passageId: string, today: string): ReadingState;
export function addExtraDay(r: ReadingState, passageId: string): ReadingState;
// intro.ts
export type PinyinMode = 'full' | 'unknown' | 'none';
export function introLines(oral: OralInfo): { hello: string; body: string | null; thanks: string };
export function pinyinMode(warmups: number): PinyinMode;
// stars.ts
export function earnsBonus(prev: Pick<Recording, 'level' | 'durationSec'> | undefined, cur: { level: number; durationSec: number }): boolean;
// loudness.ts
export const LOUD_ENOUGH = 0.05, QUIET_HINT_MS = 2000;
export function rmsLevel(samples: Float32Array): number;
export function average(levels: number[]): number;
export function quietFor(levels: { at: number; level: number }[], now: number): number; // ms the level has been continuously below LOUD_ENOUGH, ending at now
```

- [ ] **Step 1: Failing tests:**

```ts
// phrases.test.ts
import { describe, expect, it } from 'vitest';
import { displayText, splitPhrases } from './phrases';
describe('phrases', () => {
  it('splits after Chinese punctuation and at parent / marks', () => {
    expect(splitPhrases('我家有五个人：爸爸、妈妈和我。爸爸是医生，妈妈是老师。')).toEqual(['我家有五个人：', '爸爸、', '妈妈和我。', '爸爸是医生，', '妈妈是老师。']);
    expect(splitPhrases('今天天气很好 / 我们去公园玩。')).toEqual(['今天天气很好', '我们去公园玩。']);
    expect(splitPhrases('  ')).toEqual([]);
    expect(displayText('今天天气很好 / 我们去公园玩。')).toBe('今天天气很好我们去公园玩。');
  });
});
```

```ts
// cycle.test.ts
import { describe, expect, it } from 'vitest';
import { addExtraDay, CYCLE_DAYS, finishDay, pickPassage, readingPool, type ReadingPassage } from './cycle';
const R0 = { passageId: null, days: 0, extra: 0, lastDay: null, lastRead: {}, warmups: 0 };
const P = (id: string, source: 'parent' | 'builtin' = 'builtin'): ReadingPassage => ({ id, title: id, text: '我。', source });
describe('reading cycle', () => {
  it('parent passages come first, in the order added, then eligible built-ins', () => {
    const pool = readingPool([{ id: 'pp:b', title: 'b', text: '我。', createdAt: 2 }, { id: 'pp:a', title: 'a', text: '我。', createdAt: 1 }], [{ id: 'p01', title: 'x', text: '我。' }, { id: 'p02', title: 'y', text: '鬱。' }], new Set(['我']));
    expect(pool.map((p) => p.id)).toEqual(['pp:a', 'pp:b', 'p01']);
  });
  it('keeps a passage for 3 practice days, counting each date once, then moves on', () => {
    const pool = [P('pp:a', 'parent'), P('p01')];
    let r = { ...R0 };
    expect(pickPassage(r, pool, '2026-10-05')?.id).toBe('pp:a');
    r = finishDay(r, 'pp:a', '2026-10-05');
    r = finishDay(r, 'pp:a', '2026-10-05'); // same day twice
    expect(r.days).toBe(1);
    r = finishDay(finishDay(r, 'pp:a', '2026-10-06'), 'pp:a', '2026-10-07');
    expect(r.days).toBe(CYCLE_DAYS);
    expect(pickPassage(r, pool, '2026-10-08')?.id).toBe('p01');
  });
  it('an extra day keeps the current passage one more day, at most twice', () => {
    let r = finishDay(finishDay(finishDay({ ...R0 }, 'pp:a', '2026-10-05'), 'pp:a', '2026-10-06'), 'pp:a', '2026-10-07');
    r = addExtraDay(addExtraDay(addExtraDay(r, 'pp:a'), 'pp:a'), 'pp:a');
    expect(r.extra).toBe(2);
    expect(pickPassage(r, [P('pp:a', 'parent'), P('p01')], '2026-10-08')?.id).toBe('pp:a');
    expect(addExtraDay(r, 'p01')).toBe(r); // not the current passage: no change
  });
  it('skips built-ins read in the last 30 days, and falls back to the least recently read', () => {
    const r = { ...R0, lastRead: { p01: '2026-10-01', p02: '2026-09-01' } };
    expect(pickPassage(r, [P('p01'), P('p02')], '2026-10-05')?.id).toBe('p02');
    const all = { ...R0, lastRead: { p01: '2026-10-01', p02: '2026-10-02' } };
    expect(pickPassage(all, [P('p01'), P('p02')], '2026-10-05')?.id).toBe('p01');
  });
  it('a deleted current passage moves the cycle on; an empty pool gives nothing', () => {
    const r = { ...R0, passageId: 'pp:gone', days: 1, lastDay: '2026-10-04' };
    expect(pickPassage(r, [P('p01')], '2026-10-05')?.id).toBe('p01');
    expect(pickPassage(R0, [], '2026-10-05')).toBeNull();
  });
});
```

```ts
// intro.test.ts
import { describe, expect, it } from 'vitest';
import { introLines, pinyinMode } from './intro';
const oral = { name: '小明', age: '8', school: '光明小学', className: '二年级', customIntro: '' };
describe('self-introduction', () => {
  it('builds the standard script from Settings', () => {
    expect(introLines(oral)).toEqual({ hello: '老师好！', body: '我叫小明。我今年8岁。我在光明小学读二年级。', thanks: '谢谢老师！' });
  });
  it('a custom script replaces the body; missing details drop the body', () => {
    expect(introLines({ ...oral, customIntro: '大家好，我是小明。' }).body).toBe('大家好，我是小明。');
    expect(introLines({ ...oral, school: '' }).body).toBeNull();
  });
  it('pinyin fades: full for 5 warm-ups, unknown-only for 5, then none', () => {
    expect([0, 4, 5, 9, 10, 30].map(pinyinMode)).toEqual(['full', 'full', 'unknown', 'unknown', 'none', 'none']);
  });
});
```

```ts
// stars.test.ts
import { describe, expect, it } from 'vitest';
import { earnsBonus } from './stars';
describe('bonus star', () => {
  it('for reading louder on average, or 10% quicker, than last time', () => {
    expect(earnsBonus(undefined, { level: 0.2, durationSec: 20 })).toBe(false);
    expect(earnsBonus({ level: 0.1, durationSec: 20 }, { level: 0.12, durationSec: 22 })).toBe(true);
    expect(earnsBonus({ level: 0.1, durationSec: 20 }, { level: 0.09, durationSec: 18 })).toBe(true);
    expect(earnsBonus({ level: 0.1, durationSec: 20 }, { level: 0.1, durationSec: 19 })).toBe(false);
    expect(earnsBonus({ level: undefined, durationSec: 20 }, { level: 0.1, durationSec: 20 })).toBe(false); // old recording without a level
  });
});
```

```ts
// loudness.test.ts
import { describe, expect, it } from 'vitest';
import { average, LOUD_ENOUGH, quietFor, rmsLevel } from './loudness';
describe('loudness', () => {
  it('RMS of a signal', () => {
    expect(rmsLevel(new Float32Array([0, 0, 0, 0]))).toBe(0);
    expect(rmsLevel(new Float32Array([0.5, -0.5, 0.5, -0.5]))).toBeCloseTo(0.5);
    expect(average([])).toBe(0);
    expect(average([0.1, 0.3])).toBeCloseTo(0.2);
  });
  it('measures how long he has been too quiet', () => {
    const q = LOUD_ENOUGH / 2, l = LOUD_ENOUGH * 2;
    const series = [{ at: 0, level: l }, { at: 100, level: q }, { at: 1200, level: q }, { at: 2300, level: q }];
    expect(quietFor(series, 2300)).toBe(2200);
    expect(quietFor([...series, { at: 2400, level: l }], 2400)).toBe(0);
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/langdu`. Expected: FAIL (modules missing).
- [ ] **Step 3: Implement.**

```ts
// phrases.ts
const BREAK = /([，。！？；：、])/;
export function displayText(text: string): string {
  return text.replace(/\s*\/\s*/g, '');
}
/** Read-aloud phrases: split after Chinese punctuation (kept on the left) and at the parent's '/' marks. */
export function splitPhrases(text: string): string[] {
  const out: string[] = [];
  for (const chunk of text.split('/')) {
    let cur = '';
    for (const part of chunk.split(BREAK)) {
      if (!part) continue;
      cur += part;
      if (BREAK.test(part)) { out.push(cur.trim()); cur = ''; }
    }
    if (cur.trim()) out.push(cur.trim());
  }
  return out.filter(Boolean);
}
```

```ts
// cycle.ts
import { eligiblePassages } from '../activities/speaking/prompts';
import { addDays, localDateKey, parseDateKey } from '../lib/date';
import type { ParentPassage, Passage, ReadingState } from '../types';

export const CYCLE_DAYS = 3;
export const MAX_EXTRA = 2;
export const RECENT_DAYS = 30;
export interface ReadingPassage { id: string; title: string; text: string; source: 'parent' | 'builtin' }

export function readingPool(parent: ParentPassage[], builtins: Passage[], knownChars: Set<string>): ReadingPassage[] {
  return [
    ...[...parent].sort((a, b) => a.createdAt - b.createdAt).map((p) => ({ id: p.id, title: p.title, text: p.text, source: 'parent' as const })),
    ...eligiblePassages(builtins, knownChars).map((p) => ({ ...p, source: 'builtin' as const })),
  ];
}

const doneWith = (r: ReadingState) => r.days >= CYCLE_DAYS + r.extra;

/** Today's passage: the current one until its days are used up, then the next unread parent text, then a built-in not read lately. */
export function pickPassage(r: ReadingState, pool: ReadingPassage[], today: string): ReadingPassage | null {
  if (!pool.length) return null;
  const current = pool.find((p) => p.id === r.passageId);
  if (current && (!doneWith(r) || r.lastDay === today)) return current;
  const others = pool.filter((p) => p.id !== r.passageId);
  const unreadParent = others.find((p) => p.source === 'parent' && !r.lastRead[p.id]);
  if (unreadParent) return unreadParent;
  const cutoff = localDateKey(addDays(parseDateKey(today), -RECENT_DAYS));
  const fresh = others.find((p) => p.source === 'builtin' && !(r.lastRead[p.id] && r.lastRead[p.id]! > cutoff));
  if (fresh) return fresh;
  const byOldest = [...(others.length ? others : pool)].sort((a, b) => (r.lastRead[a.id] ?? '').localeCompare(r.lastRead[b.id] ?? ''));
  return byOldest[0] ?? null;
}

/** Count one practice day for this passage (once per date). Switching passage starts a fresh cycle. */
export function finishDay(r: ReadingState, passageId: string, today: string): ReadingState {
  const same = r.passageId === passageId;
  if (same && r.lastDay === today) return r;
  return { ...r, passageId, days: same ? r.days + 1 : 1, extra: same ? r.extra : 0, lastDay: today, lastRead: { ...r.lastRead, [passageId]: today } };
}

export function addExtraDay(r: ReadingState, passageId: string): ReadingState {
  if (r.passageId !== passageId || r.extra >= MAX_EXTRA) return r;
  return { ...r, extra: r.extra + 1 };
}
```

(Note the `lastDay === today` clause in `pickPassage`: the day a cycle completes, today's passage stays the same for extra rounds.)

```ts
// intro.ts
import type { OralInfo } from '../types';
export type PinyinMode = 'full' | 'unknown' | 'none';
export function introLines(oral: OralInfo): { hello: string; body: string | null; thanks: string } {
  const custom = oral.customIntro.trim();
  const ready = [oral.name, oral.age, oral.school, oral.className].every((v) => v.trim());
  const body = custom || (ready ? `我叫${oral.name.trim()}。我今年${oral.age.trim()}岁。我在${oral.school.trim()}读${oral.className.trim()}。` : null);
  return { hello: '老师好！', body, thanks: '谢谢老师！' };
}
export function pinyinMode(warmups: number): PinyinMode {
  return warmups < 5 ? 'full' : warmups < 10 ? 'unknown' : 'none';
}
```

```ts
// stars.ts
import type { Recording } from '../types';
export function earnsBonus(prev: Pick<Recording, 'level' | 'durationSec'> | undefined, cur: { level: number; durationSec: number }): boolean {
  if (!prev) return false;
  const louder = typeof prev.level === 'number' && cur.level > prev.level;
  const quicker = prev.durationSec > 0 && cur.durationSec <= prev.durationSec * 0.9;
  return louder || quicker;
}
```

```ts
// loudness.ts
export const LOUD_ENOUGH = 0.05; // RMS; tune on the iPad
export const QUIET_HINT_MS = 2000;
export function rmsLevel(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (const s of samples) sum += s * s;
  return Math.sqrt(sum / samples.length);
}
export const average = (levels: number[]) => (levels.length ? levels.reduce((a, b) => a + b, 0) / levels.length : 0);
export function quietFor(levels: { at: number; level: number }[], now: number): number {
  let since = now;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (levels[i]!.level >= LOUD_ENOUGH) break;
    since = levels[i]!.at;
  }
  return now - since;
}
```

- [ ] **Step 4: Run** `npx vitest run src/langdu`. Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(langdu): phrase splitting, 3-day cycle, self-introduction with fading pinyin, bonus star, loudness maths`.

### Task 3: Recorder levels + loudness meter

**Files:**
- Modify: `src/audio/recorder.ts`, `src/audio/recorder.test.ts`
- Create: `src/activities/langdu/LoudnessMeter.tsx`, `src/activities/langdu/LoudnessMeter.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `rmsLevel`, `average`, `quietFor`, `LOUD_ENOUGH`, `QUIET_HINT_MS` (Task 2).
- Produces:
  - `startRecording(onAutoStop, onLevel?: (level: number) => void)`. When `onLevel` is given, an `AudioContext` + `AnalyserNode` on the same stream reports `rmsLevel` every 100 ms. `FinishedRecording` gains `level?: number`, the average of the reported levels. The AudioContext is closed on stop and on cancel.
  - `LoudnessMeter({ level, quietMs }: { level: number; quietMs: number })` renders a `div.meter[role=meter][aria-valuenow]` with a fill bar and a target tick. When `level >= LOUD_ENOUGH` it adds `.is-loud`, and shows `Label 真棒！` ("great!") or Truffle's perked ears. When `quietMs >= QUIET_HINT_MS` it shows `Label 大声一点！`.

- [ ] **Step 1: Failing tests:**

```tsx
// LoudnessMeter.test.tsx
import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { LOUD_ENOUGH, QUIET_HINT_MS } from '../../langdu/loudness';
import { LoudnessMeter } from './LoudnessMeter';
describe('LoudnessMeter', () => {
  it('fills with the level and marks loud enough', () => {
    const { container } = render(<LoudnessMeter level={LOUD_ENOUGH * 2} quietMs={0} />);
    expect(container.querySelector('.meter')?.classList.contains('is-loud')).toBe(true);
    expect(screen.queryByText('大声一点！')).toBeNull();
  });
  it('asks for a louder voice only after 2 s of quiet', () => {
    const { rerender } = render(<LoudnessMeter level={LOUD_ENOUGH / 3} quietMs={QUIET_HINT_MS - 100} />);
    expect(screen.queryByText('大声一点！')).toBeNull();
    rerender(<LoudnessMeter level={LOUD_ENOUGH / 3} quietMs={QUIET_HINT_MS} />);
    expect(screen.getByText('大声一点！')).toBeTruthy();
  });
});
```

Recorder: add a test that `startRecording(…, onLevel)` with stubbed `navigator.mediaDevices.getUserMedia`, `MediaRecorder` and `AudioContext` (an analyser whose `getFloatTimeDomainData` fills 0.5/−0.5) reports a level near 0.5 via fake timers, and that `stop()` resolves with `level` ≈ 0.5 and closes the context. Follow the existing `vi.stubGlobal` style in `recorder.test.ts`.

- [ ] **Step 2: Run** `npx vitest run src/audio src/activities/langdu`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - In `startRecording`, after getting `stream`, if `onLevel`:
    - `const ctx = new (window.AudioContext ?? (window as any).webkitAudioContext)();`
    - `const src = ctx.createMediaStreamSource(stream); const an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);`
    - `const buf = new Float32Array(an.fftSize); const levels: number[] = [];`
    - `const tick = setInterval(() => { an.getFloatTimeDomainData(buf); const l = rmsLevel(buf); levels.push(l); onLevel(l); }, 100);`
  - `release()` clears `tick` and calls `ctx.close()`.
  - `stop` resolves with `level: levels.length ? average(levels) : undefined`.
  - If constructing the AudioContext throws, carry on recording without levels; never block.
  - Write `LoudnessMeter`, with CSS: a horizontal ink-outlined bar, a green fill (`var(--green)`), and a dashed target tick at the `LOUD_ENOUGH` position. The bar maps 0…`LOUD_ENOUGH * 3` to 0–100%.
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(langdu): microphone level while recording, loudness meter with a gentle 大声一点`.

### Task 4: LangduStep (warm-up → echo → read all → listen back) in the daily session

**Files:**
- Create: `src/activities/langdu/LangduStep.tsx`, `src/activities/langdu/LangduStep.test.tsx`
- Modify: `src/app/SessionScreen.tsx` (replace the SpeakingStep wiring), `src/app/SessionScreen.test.tsx`, `src/styles.css`
- Delete: `chooseSpeakingPrompt` (keep `eligiblePassages` in `prompts.ts`) and `SpeakingStep.tsx` + test, once nothing imports them.

**Interfaces:**
- Consumes: Tasks 1–3, `speak`, `Label`, `Pet`, `BottomBar`.
- Produces:

```ts
export interface LangduResult {
  intro: FinishedRecording | null; // daily step only
  read: FinishedRecording | null;  // null when the mic was unavailable
}
export function LangduStep(props: {
  passage: ReadingPassage;
  oral: OralInfo;
  warmups: number;          // kid.reading.warmups
  knownChars: Set<string>;
  kid: KidState;
  withWarmup: boolean;      // false for extra rounds
  onDone: (r: LangduResult) => void;
}): JSX.Element;
```

**Behaviour:**
1. **Warm-up** (`withWarmup`):
   - Truffle (`Pet`) with bubble 你好！; `speak('你好！')` on enter.
   - Shows `hello`, then `body` (if any), as `Label`s. Pinyin follows `pinyinMode(warmups)`:
     - `full`: normal `Label`;
     - `unknown`: `Label` with pinyin only over characters not in `knownChars`. Add an optional `pinyinFor?: (ch: string) => boolean` prop to `Label`; when it returns false that cell's `.label__py` is empty;
     - `none`: plain text without pinyin cells (use `Label` with `pinyinFor={() => false}`).
   - A mic button records, as in SpeakingStep. `继续` is enabled after a recording, or at once when the mic is blocked.
2. **Echo:**
   - One phrase at a time from `splitPhrases(passage.text)`, big `Label`, with `speak(phrase)` on enter.
   - Buttons: `再听` (speak again) and `下一句` ("next sentence"); on the last phrase, `开始朗读` ("start reading").
   - A small progress line `2 / 5`.
3. **Read all:**
   - `displayText(passage.text)` as a `Label` paragraph; the title as an h2 `Label`.
   - The mic button records with `onLevel`. The meter shows only while recording; `quietMs` comes from a levels ref and `quietFor`.
   - Stop → listen back.
4. **Listen back:**
   - an `<audio controls>` of the read;
   - `重录` (re-record) returns to read all;
   - `完成` (done) calls `onDone`.
   - If `withWarmup` is true, the thanks line `谢谢老师！` shows (spoken by TTS) before `完成`.

**Mic blocked:** if `recordingSupported()` is false or `startRecording` throws, show the existing note "麦克风没有打开。我们下次再录！" and let him continue. `onDone({ intro: null, read: null })`.

**Session wiring (`SessionScreen.tsx`):**
- Load `listParentPassages(db)`, `getSettings(db)` (for `oral`) and the kid.
- Compute `const pool = readingPool(parent, PASSAGES, know.knownChars); const passage = pickPassage(kid.reading, pool, today)`. Store `{ passage, oral }` in state instead of `speaking`. If `passage` is null, auto-finish the step as today.
- `onDone`:
  1. Save the `intro` recording as `{ kind: 'intro' }` and the `read` recording as `{ kind: 'passage', passageId }` with `level`.
  2. Find the previous recording of the same passage (`listRecordings`, newest first, excluding the one just saved). `earnsBonus(prev, { level: read.level ?? 0, durationSec: read.durationSec })`.
  3. Update the kid: `reading = finishDay(kid.reading, passage.id, today)`, `warmups + (intro ? 1 : 0)`, `bonusStars + (bonus ? 1 : 0)`. `saveKid`.
  4. `finishTimedStep()`.
  5. When `bonus`, show a short "比上次更好！" ("better than last time!") toast or celebration burst before finishing (reuse `burst`).

- [ ] **Step 1: Failing tests** (`LangduStep.test.tsx`; mock `../../audio/recorder` so `startRecording` returns a controllable recording, and mock speech):

```tsx
it('runs warm-up, echo by phrase, read and listen back, then reports both recordings', async () => {
  const onDone = vi.fn();
  render(<LangduStep passage={{ id: 'pp:1', title: '我家', text: '我爱爸爸，我爱妈妈。', source: 'parent' }} oral={{ name: '小明', age: '8', school: '光明小学', className: '二年级', customIntro: '' }} warmups={0} knownChars={new Set()} kid={DEFAULT_KID} withWarmup onDone={onDone} />);
  expect(screen.getByText('老师好！')).toBeTruthy();
  expect(screen.getByText('我叫小明。我今年8岁。我在光明小学读二年级。')).toBeTruthy();
  await recordOnce(); // helper: click 开始录音, then 停止
  fireEvent.click(screen.getByText('继续'));
  expect(screen.getByText('我爱爸爸，')).toBeTruthy();
  expect(speak).toHaveBeenLastCalledWith('我爱爸爸，');
  fireEvent.click(screen.getByText('下一句'));
  expect(screen.getByText('我爱妈妈。')).toBeTruthy();
  fireEvent.click(screen.getByText('开始朗读'));
  await recordOnce();
  expect(screen.getByText('谢谢老师！')).toBeTruthy();
  fireEvent.click(screen.getByText('完成'));
  expect(onDone).toHaveBeenCalledWith({ intro: expect.objectContaining({ durationSec: expect.any(Number) }), read: expect.objectContaining({ level: expect.any(Number) }) });
});
it('fades pinyin: unknown-only after 5 warm-ups, none after 10', () => {
  // render with warmups 5 and knownChars containing 老,师 → .label__py over 老 and 师 empty, over 好 present
  // render with warmups 10 → every .label__py empty
});
it('without a microphone, explains and lets him finish', async () => {
  // recordingSupported → false: the note shows, 继续 works through echo, read shows the note, 完成 → onDone({ intro: null, read: null })
});
it('extra rounds skip the warm-up', () => {
  // withWarmup={false}: first screen is the echo phrase, not 老师好！
});
```

(Write the three sketched tests out in full in the same style as the first; they are listed briefly here only to keep the plan readable. Every assertion named in the comments must be in the real test.)

`SessionScreen.test.tsx`: a session with only `speaking` enabled and one parent passage runs the langdu step to the celebration. Afterwards:
- `getKid` shows `reading.days === 1`, `reading.passageId === 'pp:1'` and `warmups === 1`;
- two recordings are saved (`intro` and the passage);
- running the step again the same day doesn't raise `days`.

- [ ] **Step 2: Run** `npx vitest run src/activities/langdu src/app/SessionScreen.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the component, the `Label` `pinyinFor` prop (add a Label test: `pinyinFor={(c) => c !== '好'}` leaves 好's pinyin empty) and the session wiring. Delete `SpeakingStep` and `chooseSpeakingPrompt` and their tests, with a ledger note. Update `RecordingsPanel.describe` for `{ kind: 'intro' }` → '🙋 Self-introduction'.
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(langdu): daily 朗读 step — etiquette warm-up, echo by phrase, read with the meter, listen back, 3-day cycle, bonus star`.

### Task 5: Home 朗读 button + extra-round screen

**Files:**
- Create: `src/app/LangduScreen.tsx`
- Modify: `src/app/AppContext.tsx` (Route `{ name: 'langdu' }`), `src/App.tsx`, `src/app/HomeScreen.tsx`, `src/styles.css`
- Test: `src/app/home.test.tsx`

**Interfaces:**
- Consumes: `LangduStep`, `readingPool`, `pickPassage`, `listParentPassages`.
- Produces:
  - Home shows `button.langdu-btn` (aria-label `朗读`), with an InkIcon `mic` and `Label 朗读`, under the word-of-the-day card. It shows only when `pickPassage` returns a passage.
  - `LangduScreen` runs `LangduStep withWarmup={false}` on today's passage. `onDone` saves the read recording (no stars, no cycle change), then `go({ name: 'home' })`. An `X` (回家, "go home") in the top bar.

- [ ] **Step 1: Failing test:**

```tsx
it('Home 朗读 button runs an extra round of today\'s passage without changing the cycle or stars', async () => {
  // seed a parent passage pp:1 and kid.reading = { …, passageId: 'pp:1', days: 1, lastDay: '2026-10-01' }
  // render <HomeScreen/>, click 朗读 → app.go called with { name: 'langdu' }
  // render <LangduScreen/>, first screen is the echo phrase (no 老师好！), finish with the mocked recorder
  // → one passage recording saved; getKid shows reading.days still 1 and bonusStars unchanged
});
```

(Write it in full in the file's style.)

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(langdu): 朗读 button on Home for extra rounds`.

### Task 6: Parent — 朗读 texts panel + 口试 settings

**Files:**
- Create: `src/parent/PassagesPanel.tsx`
- Modify: `src/parent/ParentArea.tsx` (new tab `'passages'`, label "Reading texts", lucide `BookOpenText` or `FileText`), `src/parent/SettingsPanel.tsx`, `src/parent/PicturesPanel.tsx` (a one-line note: "Pictures return in the upcoming picture-story activity; they are not shown in lessons for now.")
- Test: `src/parent/parentB.test.tsx` (or a new `src/parent/passages.test.tsx`)

**Behaviour:**
- **The passages panel:**
  - a list (title, the first 20 characters, `Edit` and `Delete` with `confirm`);
  - an add/edit form with a title input and a textarea, with the hint: *Paste the text from school. Optional: type / where he should pause.*;
  - a live phrase preview using `splitPhrases`;
  - the save button is disabled until there is at least one Han character;
  - ids are `pp:${crypto.randomUUID()}`, `createdAt: Date.now()`.
- **Settings, "Oral exam (口试)" section:** inputs for Chinese name, age, school (placeholder `XX小学`), class (placeholder `二年级`) and a custom introduction (textarea, optional), plus a preview of the script via `introLines`. Saved through `updateSettings({ oral })`.

- [ ] **Step 1: Failing tests:**

```tsx
it('adds a school text, previews its phrases, edits and deletes it', async () => {
  // render <PassagesPanel/>, type title 我的学校 and text 我的学校很大 / 有很多树。
  // preview lists 我的学校很大 and 有很多树。; Save → listParentPassages has 1 with that text
  // Edit → change title → saved; Delete (confirm stubbed true) → empty
});
it('saves the oral-exam details and previews the self-introduction', async () => {
  // render <SettingsPanel/>, fill 小明 / 8 / 光明小学 / 二年级 → preview shows 我叫小明。我今年8岁。我在光明小学读二年级。
  // getSettings(app.db).oral matches
});
```

(Write them in full, using the parent tests' existing helpers.)

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(parent): reading texts for 朗读, oral-exam details for the self-introduction`.

### Task 7: Parent — mark misread characters → priority words + extra day

**Files:**
- Create: `src/langdu/misreads.ts`, `src/langdu/misreads.test.ts`
- Modify: `src/parent/RecordingsPanel.tsx`
- Test: `src/parent/parentA.test.tsx` (or a new `src/parent/misreads.test.tsx`)

**Interfaces:**
- Produces: `applyMisreads(db: AppDb, recording: Recording, chars: string[], now: Date): Promise<void>`. It:
  1. Saves `recording.misread = chars` (`updateRecording`).
  2. For each char, with built-in word id `b:${char}`:
     - if a `recognise` card exists, sets `fsrs.due = now` (keeping the rest) and `putCards`;
     - else, if the word exists, `putWords({ ...word, listedAt: now.getTime() })`;
     - else skips it.
  3. Loads the kid and saves `reading = addExtraDay(kid.reading, passageId)`, only when there are chars and the prompt is a passage.

- [ ] **Step 1: Failing tests:**

```ts
it('turns misread characters into priority words and gives the passage an extra day', async () => {
  const db = await freshDb();
  const now = new Date(2026, 9, 5, 17);
  await putWords(db, builtinWords(0));
  await putCards(db, [makeCard('b:大', 'recognise', new Date(2026, 10, 1), true)]);
  await saveKid(db, { ...DEFAULT_KID, reading: { passageId: 'pp:1', days: 3, extra: 0, lastDay: '2026-10-05', lastRead: {}, warmups: 0 } });
  const rec = { id: 'r1', createdAt: now.getTime(), prompt: { kind: 'passage' as const, passageId: 'pp:1' }, blob: new Blob(), mime: 'audio/mp4', durationSec: 12 };
  await addRecording(db, rec);
  await applyMisreads(db, rec, ['大', '天'], now);
  expect((await getCard(db, 'b:大:recognise'))!.fsrs.due.getTime()).toBe(now.getTime());
  expect((await getWord(db, 'b:天'))!.listedAt).toBe(now.getTime());
  expect((await getKid(db))!.reading.extra).toBe(1);
  expect((await listRecordings(db))[0]!.misread).toEqual(['大', '天']);
});
```

UI test: in RecordingsPanel, a passage recording shows its text as character buttons (`button.misread-ch`). Tapping 大 marks it (`aria-pressed`), and 保存 calls through, so the card is due now. A deleted parent passage shows "📖 (deleted text)".

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The passage text for a recording comes from parent passages or `PASSAGES`.
  - Characters already in `recording.misread` start pressed.
  - Only Han characters are buttons; punctuation is plain text.
  - The save button reads "Save misread characters" and shows "Saved: 2 characters will come up in practice." afterwards.
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(parent): mark misread characters on 朗读 recordings — they come back as priority words`.

### Task 8: Speech-recognition test (opt-in spike, parent area)

**Files:**
- Create: `src/parent/AsrTest.tsx`
- Modify: `src/parent/SettingsPanel.tsx` (an "Advanced" disclosure)
- Test: `src/parent/asr.test.tsx`

**Behaviour:** this is the spike from §16. It must run on the real iPad, so it ships as a parent-only test, not a feature.
- **Recognition missing** (`window.SpeechRecognition ?? window.webkitSpeechRecognition` is undefined): "Speech recognition isn't available in this browser." and nothing else.
- **Recognition available:** a notice: *This test uses Apple's speech service — your child's voice may be sent to Apple to be transcribed. Nothing is saved.* Then a `Start test` button.
- **The test:**
  - It shows the sentence `我家有五个人。爸爸是医生，妈妈是老师。` and listens with `lang = 'zh-CN'`, `interimResults = false`.
  - It shows what it heard, with the characters that differ from the sentence highlighted (a simple character-by-character LCS diff).
  - Then: "If this is mostly right, tell Claude and auto-hints can be added."
- No auto-hints are wired in this plan.

- [ ] **Step 1: Failing tests:**
  - with no recognition API, the unavailable message shows;
  - with a stubbed `webkitSpeechRecognition` that fires `onresult` with 我家有五个人。爸爸是医生，妈妈是老狮。, the result shows with 狮 highlighted (`mark`).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** (a small `diffChars(expected, heard): { ch: string; ok: boolean }[]` in the same file, with its own unit test).
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(parent): opt-in speech-recognition test (on-device check before any auto-hints)`.

### Task 9: Walkthrough + docs

- [ ] In the browser at 768×1024 and 1024×768, on the seed profile (localhost:4173; clear the service worker after each build):
  - add a parent passage with `/` marks;
  - fill in the oral details;
  - run today's lesson to the 朗读 step: warm-up script, echo phrases, read-all with the meter (the browser pane has no real mic, so check the blocked path, and check the meter via the test gallery or a stubbed level);
  - listen back, then finish;
  - Home 朗读 button for an extra round;
  - parent Recordings: mark a character, save, and check it is due (Words or Dashboard);
  - Settings: the ASR test shows its notice or unavailable message.
- [ ] Check the Review Focus items 1–5 explicitly; fix findings with TDD.
- [ ] Update `README.md` (the speaking step is now the 朗读 coach; the parent can add school texts and mark misreads) and the parent help copy if any.
- [ ] `npm test && npm run build`. Expected: green, then built. **Commit** `docs: 朗读 coach in README`.
