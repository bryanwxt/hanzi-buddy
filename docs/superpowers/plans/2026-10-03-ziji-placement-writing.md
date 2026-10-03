# 字己 — Plan 5: Banded placement + writing cues — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Replace the stop-at-first-miss placement check with a banded pinyin quiz (8 per band, pass at 6/8, stop at the 3rd miss in a band).
- Add meaning and source-word cues to 听写 prompts.

**Architecture:**
- **Placement rules:** a pure state machine in `src/placement/placement.ts` (bands, samples, step, result word ids). `applyPlacement` seeds cards by word id. `PlacementScreen` drives the quiz.
- **Writing cues:** a pure `writingCue(word)` in `src/activities/writing/cue.ts`, rendered by `WritingStep`.

**Tech Stack:** Vite 7, Preact 10, TypeScript 5.9, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-10-02-ziji-truffle-design.md` §14.

## Global Constraints

- **Placement numbers:** band size 60, 8 samples per band, pass at 6/8, stop at the 3rd miss in a band. 不知道 counts as a miss.
- **Placement feedback:** none during the check. Truffle is `neutral`.
- **Seeding:** still uses `seededKnownCard` (Review, due in 14 days). Existing cards are never overwritten.
- **Writing meaning:** first sense only, `meaning.split(/[,;，；]/)[0].trim()`. An empty meaning means no meaning line.
- **Writing blank:** the source word with the target character replaced by `＿`. Speech reads `${char}，${example}的${char}`.
- **Publishing:** never push or deploy without the parent's go-ahead in chat.

## Review Focus

1. **A child who knows nothing:** stops in band 1 after 3 misses, seeds only his correct answers (possibly none), and the app still works.
2. **A child who knows everything:** all 10 bands pass, and all 600 characters are seeded.
3. **Re-running placement** on a profile with progress must not reset existing cards.
4. **Characters with several readings** in the quiz must not offer a valid reading as a wrong option (reuse `pickPinyinDistractors`).
5. **Multi-character parent words** in writing: they show the meaning only and speak the word.

---

### Task 1: Banded placement rules (pure)

**Files:**
- Modify: `src/placement/placement.ts`, `src/placement/placement.test.ts`, `src/placement/apply.ts`, `src/placement/apply.test.ts`

**Interfaces:**
- Produces:

```ts
export const BAND_SIZE = 60, PER_BAND = 8, PASS_AT = 6;
export function placementBands(words: Word[]): Word[][];            // built-in by rank, chunks of 60
export function bandSamples(band: Word[], n = PER_BAND): Word[];     // evenly spaced
export interface PlacementState { band: number; index: number; wrong: number; right: string[]; passed: number[]; done: boolean }
export function startPlacement(): PlacementState;
export function placementStep(state: PlacementState, bands: Word[][], correct: boolean, wordId: string): PlacementState;
export function placementKnownIds(state: PlacementState, bands: Word[][]): string[]; // passed bands' ids + right ids in the stopping band
export function seedPlacementCards(words: Word[], knownIds: string[], now: Date): CardRecord[];
// applyPlacement(db, knownIds, now)
```

- [ ] **Step 1: Failing tests.**
  - Bands: 10 bands of 60 from 600 built-ins; samples are evenly spaced, 8 per band.
  - Step: 6 right then 2 wrong passes band 1 (moves to band 2). 3 wrong in a band → done. All bands passed → done.
  - Known ids: passed bands give all their ids; in the stopping band, only the right ids count.
  - Seeding: by ids only; existing cards are kept.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Remove `pickPlacementSamples` and `placementCutoff`.
- [ ] **Step 4: Run.** Expected: PASS. **Commit.**

### Task 2: Placement quiz screen

**Files:**
- Modify: `src/app/PlacementScreen.tsx`, `src/app/setup.test.tsx`, `src/App.test.tsx`

**Interfaces:**
- Consumes: Task 1 and `pickPinyinDistractors` (flashcards).
- Produces: a screen showing the character, 4 pinyin option buttons, a 不知道 button and a band progress line (`第 n 组`). At done, it seeds and shows `你已经认识 N 个字了！`, as now.

- [ ] **Step 1: Failing test.** On a fresh app, answering band 1 (the right pinyin ×6, then 不知道 ×2) moves to band 2. Answering 不知道 ×3 then finishes, and at least the 6 band-1… seeded cards exist. Update the first-launch walk in App.test to use 不知道.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: green. **Commit.**

### Task 3: Writing cues

**Files:**
- Create: `src/activities/writing/cue.ts`, `src/activities/writing/cue.test.ts`
- Modify: `src/activities/writing/WritingStep.tsx`, `src/activities/writing/WritingStep.test.tsx`, `src/styles.css`

**Interfaces:**
- Produces: `writingCue(word: Word): { meaning: string | null; blanked: string | null; speech: string }`.

- [ ] **Step 1: Failing tests:**
  - 儿 with example 儿子 and meaning "son, child" gives `{ meaning: 'son', blanked: '＿子', speech: '儿，儿子的儿' }`;
  - 八 with no examples gives a meaning and `blanked: null`, with speech '八';
  - a parent word 大人 without a meaning gives `{ meaning: null, blanked: null, speech: '大人' }`.

  WritingStep renders `.write__meaning` and `.write__blank` with `Label`, and the speak button uses `speech`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: green. **Commit.**

### Task 4: Walkthrough

- [ ] In the browser, at 768×1024, check:
  - placement on a fresh profile (dev IndexedDB, restored afterwards);
  - a writing step with a cue.

  `npm test && npm run build`, then commit any fixes.
