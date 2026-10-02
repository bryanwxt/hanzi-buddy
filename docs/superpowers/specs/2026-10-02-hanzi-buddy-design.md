# Hanzi Buddy — Design Spec

**Date:** 2026-10-02
**Status:** Draft for review

## 1. Purpose

Help a Singapore Primary 2 child whose Chinese is below level reach P3 level by
January 2027, using about 20–30 minutes of daily, self-directed practice on an
iPad. The November–December school holiday is the main catch-up window.

The app turns evidence-based techniques into a daily habit the child can do
alone:

- **Spaced retrieval practice** for character recognition and writing (FSRS
  scheduler).
- **Component (radical) awareness**, to speed up learning new characters.
- **Handwriting practice** (听写), which supports character recognition.
- **Speaking practice** (看图说话 picture description and reading aloud), recorded
  for the parent to review.
- **Low-anxiety design**: no penalties, no visible timers, visible progress.

### Users

- **Child (primary user):** about 8 years old, uses the app alone on an iPad.
  Every activity must check itself or need no checking.
- **Parent:** sets things up, adds school word lists, reviews progress and
  recordings through a PIN-gated parent area on the same iPad.

### Success criteria

1. The child can start, complete and resume a daily session with no adult help.
2. Everything the child does works offline once the app is installed.
3. The parent can paste a school 听写 list and have those words come up in the
   child's sessions before built-in words.
4. The dashboard shows characters recognised and written, each against a
   parent-set target, plus daily minutes and trouble words.
5. A session never loses progress when the app is closed mid-way.
6. Missing a week of practice never produces a session longer than the normal
   time box.

## 2. Constraints and decisions

| Decision | Choice | Reason |
|---|---|---|
| Platform | Installable web app (PWA), used from the iPad home screen | Free, offline, no accounts, touch-first; Hanzi Writer, speech synthesis and microphone recording all work in iPad Safari |
| Framework | Vite + TypeScript + Preact | Small, builds to static files, component model suits five screens |
| Offline/PWA | `vite-plugin-pwa` (Workbox) | Precaches the app; runtime-caches stroke data |
| Storage | IndexedDB via `idb` | Holds structured data and audio blobs; survives app restarts |
| Scheduler | `ts-fsrs` (FSRS algorithm) | Modern, well-tested spaced-repetition scheduler; avoids inventing one |
| Writing check | `hanzi-writer` (quiz mode) | Stroke-by-stroke checking with hints |
| Audio out | Web Speech API `speechSynthesis`, `zh-CN` voice | Built into the iPad, offline, no audio assets needed |
| Audio in | `MediaRecorder` (`audio/mp4` on Safari, `audio/webm` fallback) | Native recording |
| Pinyin for parent words | `pinyin-pro` (bundled) | Offline, takes surrounding characters into account for words with more than one reading |
| Tests | Vitest + `fake-indexeddb` + `@testing-library/preact` | Fast unit tests for logic, a few flow tests |
| Hosting | GitHub Pages via a GitHub Actions workflow | Free static hosting. The repo holds no personal data (all child data stays on the iPad), so it can be public. Creating the remote and pushing are confirmed with the parent at deploy time |
| Location | `/Users/bryantan/apps/hanzi-buddy/` with its own git repo | Separate from the 5/3/1 app |

## 3. Architecture

```
src/
  content/     built-in words and passages; parsing of parent word lists
  srs/         FSRS wrapper: rating mapping, review, "known" checks
  store/       the only module that touches IndexedDB; schema, migrations, backup
  session/     builds the daily plan; persisted session state machine
  activities/
    flashcards/  intro card, 听音选字, 看字选音; distractor selection
    writing/     听写 with Hanzi Writer in a 田字格
    components/  radical-grouping game
    speaking/    prompt display + recorder
  audio/       speech synthesis and recorder wrappers
  parent/      PIN gate, dashboard, words, recordings, prompts, settings, backup
  ui/          shared kid-facing widgets (big buttons, stars, celebration, 田字格)
scripts/
  build-content.ts   one-off pipeline producing src/content/builtin.json
  check-content.ts   validates built-in data (also run in tests)
```

Each module keeps its logic in pure functions, with Preact components layered
on top. Only `store/` imports `idb`, and only `audio/` touches
`speechSynthesis` and `MediaRecorder`, so all other logic can be tested
without a browser.

### Key interfaces

```ts
// srs/
type Outcome =
  | { kind: 'recognise'; correct: boolean; responseMs: number }
  | { kind: 'write'; totalMisses: number };
function toRating(o: Outcome): Rating;               // Again | Hard | Good (never Easy)
function review(card: CardState, rating: Rating, now: Date): CardState;
function isKnown(card: CardState): boolean;          // state === Review

// session/
function buildSessionPlan(input: {
  cards: Card[]; words: Word[]; settings: Settings; now: Date;
}): SessionPlan;

// activities/flashcards/distractors.ts
function pickCharacterDistractors(target: Word, pool: Word[], n = 3): Word[];
function pickPinyinDistractors(target: Word, pool: Word[], n = 3): string[];

// activities/components/game.ts
function buildComponentRound(known: Word[], rng: () => number): ComponentRound | null;

// content/
function parseWordList(text: string): ParsedWord[];  // one word per line

// store/backup.ts
function exportBackup(opts: { includeRecordings: boolean }): Promise<Blob>;
function readBackup(file: Blob): Promise<BackupPreview>; // validates, no writes
function applyBackup(preview: BackupPreview): Promise<void>;
```

## 4. Data model (IndexedDB, schema version 1)

- **words** — `{ id, text, pinyin, meaning?, level: 1|2|3|null, source: 'builtin'|'parent', listName?, writeable: boolean, paused: boolean, createdAt }`
  - Built-in words are characters. Parent words may be 1–4 character words.
  - `writeable` means the word also gets a writing card (the textbook's 写字 versus 识字 split).
- **cards** — `{ id: "<wordId>:recognise" | "<wordId>:write", wordId, kind, fsrs: ts-fsrs Card, introduced: boolean }`
- **reviewLogs** — `{ id, cardId, at, rating, correct, responseMs?, misses? }`
- **sessions** — `{ date: 'YYYY-MM-DD', startedAt, activeMs, plan, cursor, results, completed }`
  - `cursor` is saved after every answer, so a session can resume.
  - Days use the device's local date.
- **recordings** — `{ id, createdAt, promptRef, blob, mime, durationSec }`
- **prompts** — `{ id, createdAt, blob }` (parent-added pictures)
- **settings** (single record) — `{ pinHash, sessionMinutes: 20, newPerDay: 5, activities: {flashcards, writing, components, speaking}, speechRate: 0.8, targetRecognise: 500, targetWrite: 150, lastBackupAt?, placementDone: boolean }`

- **kid** (single record) — `{ petName, petColor, ownedAccessories: string[], wearing: string | null, bonusStars, lastChestDate: string | null, lastStageSeen, badgesSeen: string[] }`
- **rewards** — `{ id, title, emoji, metric: 'stars' | 'known', target, createdAt, claimedAt: number | null }`
- settings also has `soundEffects: true`.

Schema changes go through numbered migrations in `store/db.ts`. Backup files
carry `formatVersion`.

## 5. The child's experience

### Home screen

- A large **今天的练习** button. If a session is in progress, it reads
  **继续** (continue).
- Streak, total stars, and a "characters I know" counter (count of recognise
  cards where `isKnown`).
- A small **Free play** button that runs extra flashcards. It doesn't count
  towards the streak.
- A small lock icon that opens the parent area.

### Session plan (`buildSessionPlan`)

Steps run in order, skipping any activity that is turned off:

1. **Flashcards.** Time box is `sessionMinutes × 0.4`. When the time box
   ends, the current card finishes and the step ends.
   - Queue order: due recognise cards, most overdue first, capped at 60;
     then new cards.
   - New cards: up to `newPerDay`, set to 0 when more than 40 cards are due.
   - New-card order: parent words (oldest list first), then built-in words by
     level and frequency rank.
   - New card flow: an intro screen (character, pinyin, audio, components
     highlighted, 1–2 example words), then immediately a quiz.
   - Quiz types alternate per review between **听音选字** (hear, pick the
     character from 4) and **看字选音** (see the character, pick the pinyin
     from 4; audio plays after answering). 听音选字 is turned off when no
     Chinese voice is available.
   - A wrong answer shows the correct one, plays its audio, rates the card
     Again, and re-inserts it 3–5 cards later in the same session. A
     re-shown card does not get a second scheduler review that day.
2. **听写 writing.** 3 words when `sessionMinutes < 25`, otherwise 5.
   - Words: due write cards first, then new write cards (at most 2 per day).
   - A write card becomes eligible once its word's recognise card `isKnown`.
   - The child hears the word and sees its pinyin, then writes each character
     in a 田字格 with Hanzi Writer quiz mode (`showHintAfterMisses: 2`).
   - Rating: total misses 0 → Good, 1–3 → Hard, 4 or more → Again.
3. **Components game.** One round of 6 questions, using only characters the
   child knows.
   - Question types: "tap all characters containing X" (a grid of 8 with 2–4
     correct), or "which part of this character means Y?".
   - Skipped when fewer than 12 characters are known.
4. **Speaking.** One prompt; records up to 60 seconds; the child can replay
   and redo before saving.
   - Prompt choice alternates between:
     - a parent picture with on-screen helper questions (谁？什么时候？在哪里？做什么？心情怎么样？)
     - a read-aloud passage in which at least 90% of the characters are known
   - Skipped (with a friendly message) if there are no eligible prompts or
     microphone permission is refused.

The session ends with a celebration screen showing stars (1 per completed
step). The streak counts a day when the session is completed.

### Rating for recognition (`toRating`)

- Wrong → Again
- Correct and `responseMs > 6000` → Hard
- Correct otherwise → Good

### Distractor rules

- **Characters (听音选字):**
  - Same character length as the target.
  - Never the same toneless pinyin as the target, so there is never a
    sound-alike ambiguity.
  - Preference order: shares a component with the target, then same level,
    then any.
  - All 4 options are distinct.
- **Pinyin (看字选音):**
  - Preference order: same syllable with a different tone, then pinyin of a
    look-alike character, then a similar syllable.
  - All 4 options are distinct, and the correct answer appears exactly once.

### Tone rules

- No red crosses and no point loss. Wrong answers show "再试试！" and the
  correct answer with audio.
- No visible timers.
- Large touch targets (at least 64 pt) and a landscape-friendly layout.
- Chinese labels for the child, with pinyin shown above in small text.

## 5a. Making it fun (added 2026-10-02 at the parent's request)

**Principles:**

- Rewards are tied to effort and completion, not only to right answers.
- Praise is about effort (你真努力！), not ability.
- Nothing the child earns can ever be lost: no sad or dying pet, no stars
  spent, no rewards withdrawn.
- No leaderboards, no purchases, nothing that looks like gambling. Treasure
  chests only appear after a completed session and only contain cosmetic
  items.

**Art:** emoji plus CSS animation; all sound effects are generated in the
browser with the Web Audio API. No image or audio files are needed.

### Pet dragon

- **Setup:** right after the parent sets the PIN, the child names the pet
  (default 小龙) and picks one of 5 colours: red, green, blue, purple, gold.
  The colour is applied with CSS `hue-rotate`.
- **Growth:** the pet's stage comes from the "characters I know" count:

  | Stage | Count | Look |
  |---|---|---|
  | 0 | 0–24 | 🥚 egg |
  | 1 | 25+ | 🐣 hatchling |
  | 2 | 75+ | 🐲, small |
  | 3 | 150+ | 🐲, large |
  | 4 | 300+ | 🐉 |
  | 5 | 500+ | 🐉 with a golden glow |

- **Companion:** the pet sits in the corner of every activity.
  - A correct answer makes it bounce, with a cheer bubble drawn at random from
    a fixed list.
  - A wrong answer shows an encouraging bubble (没关系，再来！) and no sad
    face.
- **Treasure chest:** after the first completed daily session each day, the
  child taps a chest to open it.
  - It gives a random accessory the pet doesn't own yet, from a fixed list of
    16 emoji accessories.
  - Once all 16 are owned, it gives 3 bonus stars instead.
  - The random choice is seeded by the date, so it can be tested.
- **Wardrobe:** tapping the pet on the home screen opens a wardrobe. The child
  chooses one accessory to wear, or none.

### Sticker book (贴纸本)

- **Families:** one family for each component in the radicals table that at
  least 3 built-in characters contain.
- **Family page:**
  - Every family character appears.
  - Known characters show as colourful stickers; tapping one speaks it.
  - Unknown characters show as grey "？" tiles.
  - The page shows progress, e.g. "3/8".
- **Badges:** a family is complete when all its characters are known, and that
  earns a 🏅 badge for the family. Badges appear on a shelf at the top of the
  book.
- **My words:** a separate page lists parent-added words the child knows.

### Game-style activities

- **Flashcards become 喂小龙 (feed the dragon):**
  - The pet asks for a word in a speech bubble: a 🔊 button in listen mode,
    or the character in read mode.
  - On a correct answer, the chosen tile flies to the pet, which does a
    munching animation with a crunch sound.
- **Combo counter:** consecutive correct answers in a session. At 3, 5, 10 and
  every 10 after, a "连对 N 个！🔥" banner and a rising chime appear. A wrong
  answer resets the count without saying so.
- **Components game becomes 钓鱼 (fishing):**
  - "Tap all" questions show 8 gently bobbing fish, each carrying a character.
    Tapping catches a fish into a bucket, and "检查" checks the catch.
  - "Which part" questions show the parts as bubbles.
- **Writing:** a burst of stars after each finished character, and "完美！"
  for zero misses.
- **Sound effects:**
  - six sounds: correct, wrong (soft, never harsh), combo, star, chest, level
    up
  - parent setting to turn them off
- **Celebration effects:**
  - confetti (`canvas-confetti`) for a finished session, the pet evolving, and
    a new badge
  - `prefers-reduced-motion` turns off confetti and motion

### End-of-session sequence

1. Stars earned.
2. Treasure chest, if it's the first completed daily session today.
3. Pet evolution, if its stage went up since it was last shown.
4. New sticker badges, if any since they were last shown.

### Real-world reward goals

- **Goals:** the parent sets goals in the parent area, e.g. title "Ice cream
  outing", emoji 🍦, measure "stars" or "characters known", target 100.
- **Home screen:** shows the first unclaimed goal with a progress bar.
  - When the target is reached, it shows "你做到了！Ask your parent for 🍦"
    with confetti.
  - The parent marks it as claimed in the parent area.
- **Nothing is spent:** stars are a running total of completed steps plus
  chest bonuses. Goals are milestones; reaching one doesn't use up stars.

## 6. Parent area

- **PIN gate.** A 4-digit PIN is set on first launch and stored as a SHA-256
  hash.
  - "Forgot PIN" asks a two-digit × one-digit multiplication question, then
    lets the parent set a new PIN.
  - This only keeps the child out by accident. It is not real security.
- **Dashboard:**
  - streak
  - minutes per day over the last 30 days (bar chart)
  - recognised count / `targetRecognise`
  - written count / `targetWrite`
  - weekly accuracy trend
  - trouble words: top 10 by number of Again ratings in the last 30 days
  - cards due tomorrow
  - a backup nudge when `lastBackupAt` is older than 14 days
  - a warning when no Chinese voice is installed (with the fix: Settings →
    Accessibility → Spoken Content → Voices → Chinese) or when microphone
    permission is refused
- **Words:**
  - Paste a list, one word per line, with a list name.
  - Pinyin is pre-filled by `pinyin-pro` and can be edited.
  - "Recognise only" / "Recognise + write" toggle per word, with a default per
    list.
  - Characters without stroke data are forced to recognise-only, with a note.
  - Edit, pause or delete any word. Built-in words can be paused but not
    deleted.
- **Recordings:** list by date with the prompt shown; play and delete. When
  there are more than 100, the parent is asked before the oldest are deleted.
- **Picture prompts:** add from the camera or photo library; delete.
- **Settings:** session minutes (10–40), new words per day (0–10), activity
  switches, speech rate, targets.
- **Backup:**
  - Export to a `.json` file, with recordings optionally included as base64.
    The file is saved via the share sheet or a download.
  - Import validates the file and shows a summary (number of words, cards and
    recordings, export date) before replacing anything.
- **Credits:** licence attributions for the content sources.

## 7. Content

### Built-in characters (`scripts/build-content.ts`, run once in development)

- **600 characters** in 3 app levels of 200: all characters from HSK 3.0
  levels 1 and 2.
  - Ordered by HSK level, then stroke count, then list order.
  - Source: `charlist.txt` from `elkmovie/hsk30` (MIT, © 2021 Pleco Inc.).
  - Why not Jun Da's frequency list: checked on 2026-10-02, it states no terms
    of use, so under the rule agreed at design time it isn't used.
- **Fields per character:**
  - pinyin (most common reading, via `pinyin-pro`)
  - English meaning (first 1–2 senses of the Make Me a Hanzi `definition`,
    LGPL-3.0)
  - decomposition, radical and stroke count (Make Me a Hanzi
    `dictionary.txt`)
  - 1–2 example words: words of 2–3 characters from the HSK 3.0 level 1–3
    word list (`wordlist.txt`, MIT), made only of built-in characters at the
    same or a lower app level, taken in HSK list order
  - `writeable` defaults to true for characters in the HSK 3.0 初等手写字表
    (elementary handwriting list, about 300 characters)
- All sources and licences are listed in `CREDITS.md` and on the in-app
  Credits screen.
- **Validation (`check-content.ts`, run as a test):**
  - every entry has pinyin, a meaning and a decomposition
  - stroke data exists in `hanzi-writer-data`
  - no duplicates

### Read-aloud passages

- About 20 passages of 30–80 characters, everyday topics a P2 child knows
  (school, family, food, weather, playground).
- Written for this project and checked by script to use only Level 1–2
  characters.

### Stroke data

- `hanzi-writer-data` comes from jsDelivr through the service worker using
  CacheFirst, with long expiry.
- When online, the app pre-downloads stroke data in the background for every
  active word.
- In the writing step, a word whose data is unavailable is replaced with
  another eligible word.

### First-launch placement

- About 40 characters sampled across the 3 levels, shown one at a time:
  "认识 / 不认识" (know it / don't know it).
- Samples are spread evenly across the 600-character frequency ranking and
  shown in rank order.
- The cut-off is the rank of the first sample marked 不认识. Every character
  ranked before the cut-off is seeded as known. This is deliberately cautious:
  one miss stops the seeding, and anything left unseeded simply comes up as a
  new card.
- Seeded cards are created as reviewed Good, due in 14 days.
- Placement can be re-run from the parent area.

## 8. Edge cases and data safety

- **No zh-CN voice:** detected on launch; 听音选字 is turned off and pinyin
  is shown more prominently; the parent dashboard warns.
- **Audio after a tap only (iOS):** every `speak()` call comes from a tap.
  The session start button primes the speech engine.
- **Microphone refused:** the speaking step is skipped with a friendly message;
  the dashboard shows how to re-enable it.
- **Storage:**
  - `navigator.storage.persist()` is requested on first launch.
  - The home-screen install keeps the data out of Safari's automatic clean-up.
- **Interruptions:** the session cursor and the result are saved after every
  answer. Reopening resumes at the same step and card.
- **Missed days:** reviews are capped at 60 per session; new cards pause when
  more than 40 are due.
- **Day boundary:** a session started before midnight finishes as the day it
  started.
- **App updates:** the service worker updates in the background. Data
  migrations run when the app opens; a migration that fails leaves the
  database untouched and shows an error with a backup option.
- **Import:** validated before anything is written. A bad file shows a clear
  message and changes nothing.

## 9. Testing

**Automated (Vitest):**

- `srs/`: rating mapping boundaries; `review` moves due dates forward; `isKnown`.
- `session/`:
  - queue order and the 60-card cap
  - new-card limit and the pause when the backlog is over 40
  - parent words first
  - write-card eligibility
  - number of writing words by session length
  - steps skipped for activities that are off
- `distractors`:
  - always 4 distinct options with the correct answer exactly once
  - no sound-alike options
  - component preference
  - sensible behaviour when the pool is small
- `components/game`: correct answers really contain the component; returns
  null below the known-character threshold.
- `content/parseWordList`: blank lines, spaces, duplicates, non-Chinese input.
- `store/backup`: export → import round trip using `fake-indexeddb`;
  rejecting a malformed file; migration from v1 fixtures.
- Placement seeding logic.
- Fun logic:
  - pet stage thresholds
  - the chest: deterministic by date, never repeats an accessory, gives the
    star bonus once all are owned
  - sticker families and badge completion
  - new-badge detection
  - combo milestones
  - reward goal progress
  - star totals
- `check-content`: run over `builtin.json` and passages.

**Flow tests** (`@testing-library/preact`, with the audio module mocked):

- complete a short session end to end
- close and resume mid-flashcards
- PIN gate

**In the browser pane at iPad size (1024×768 landscape):** click through
first launch, placement, a full session, and every parent screen.

**On the real iPad** (a checklist for the parent):

- Mandarin voice plays
- microphone records and plays back
- finger writing is accepted
- Add to Home Screen works
- airplane mode still works
- data survives closing the app

## 10. Out of scope for v1

- cloud sync
- viewing progress from another device
- multiple children
- accounts
- speech-recognition grading
- longer stories or reading comprehension
- Apple Pencil-specific features
- notifications

The module boundaries above let any of these be added later without
restructuring.
