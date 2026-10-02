# 字己 Truffle redesign — build report (plans 1–3)

Branch `redesign/truffle`; 271 tests passing; each plan had a fresh whole-branch review and one fix pass.

## Plan 1-look

### Rulings
- Task 2: Ruling: parts.ts generated from the approved reference geometry before the failing test (generated data — TDD generated-code exception); component itself was test-first — cost if wrong: none
- Task 2: Ruling: Step 5 visual check folded into Task 5's in-app check (a scratch page would only re-render the reference markup) — cost if wrong: a visual issue found one task later
- Task 4: Ruling: added on*pointer handler props to jsdom in src/test/setup.ts — Preact picks event-name casing from 'onpointerdown' in element; jsdom lacks it, browsers have it — cost if wrong: none (test-only)
- Task 4: Ruling: celebration tests hold with real timers (1.3 s waits) instead of fake timers — fake timers stall fake-indexeddb — cost if wrong: ~3 s slower suite
- Task 5: Ruling: FlashResult shape test updated to include hard:false — plan's interface adds `hard` — cost if wrong: none
- Task 5: Ruling: PetSetup temporary Truffle keeps the name input until Task 6; old test drops the colour assertions — PET_COLORS removed per plan — cost if wrong: none (Task 6 replaces)
- Task 5: Ruling: DEFAULT_KID.petName '小龙'→'松露' for new kids; Home shows 松露 fixed; path step renamed 认一认 with 字 icon — dragon wording gone — cost if wrong: copy only
- Task 5: Ruling: Celebration seq no longer carries `known` (only the evolve phase used it) — cost if wrong: none
- Task 8: Ruling: reduced motion not emulatable in the browser pane — covered by closeupAllowed unit test + @media rules for .truffle--bounce/.closeup; hold ring still fills (spec) — cost if wrong: a motion effect showing under reduced motion
- Task 8: Ruling: hard-one close-up not triggered live (needs a relearning card) — covered by FlashcardStep test — cost if wrong: overlay layout untested visually
- Final: Ruling: word-of-the-day pinyin context finding — not reproducible: built-in readings were generated with pinyin-pro (0 of 600 differ); the test passed before any fix so it was dropped — cost if wrong: a parent single-character word's custom reading could differ on the card
- Final: Ruling: hanzi vs swash overlap (declined: not rendered) — walkthrough at 768×1024 and 1024×768 showed swashes behind content with hanzi on clean panels — cost if wrong: a swash under a heading on some screen
- Final: Ruling: grain filter per Truffle instance vs spec "one shared definition" (declined: perf) — ≤2 Truffles on screen; per-instance ids avoid the hidden-def clipping bug seen with the dragon — cost if wrong: jank on an old iPad during the close-up
- Final: Ruling: iOS long-press / haptic touch on HoldButton (declined: needs device) — contextmenu prevented, touch-action none — check on the real iPad — cost if wrong: hold cancelled by a system gesture
- Final: Ruling: same-session retries count as hard (declined: matches spec) — stands; cooldown limits it — cost if wrong: a few extra 咦！
- Final: Ruling: word of the day changes once a session starts (declined: plan-defined) — stands — cost if wrong: mild surprise
- Final: Ruling: pre-existing white-on-orange in .combo-banner/.mic-btn (declined: not changed here) — stands — cost if wrong: low-contrast banner text
- Final: Ruling: Vite chunk-size warning (declined) — pre-existing (pinyin-pro dictionary, precached) — cost if wrong: none

### Fixed in the final review
- reduced-motion hold ring jumps full — styles.test "the hold ring still fills over 1.2 s with reduced motion" RED→GREEN, suite 244/244
- parent reward emoji picker unstyled/no selected state — parentA "marks the chosen emoji as pressed" + styles.test swatch rules RED→GREEN, suite 244/244
- small paper text on red fails contrast — styles.test "small text on the red celebration block gets an ink shadow" RED→GREEN, suite 244/244
- side-eye bubble said 再想想 with the answer already shown → 记住它！ — FlashcardStep "says remember it…" RED→GREEN, suite 244/244
- writing mixed message & per-char wow — WritingStep "stays kind after a messy character…", "never side-eyes a hard character" RED→GREEN, suite 244/244
- bubbles had no pinyin — widgets "shows pinyin above the bubble words" RED→GREEN, suite 244/244
- reached-goal green + radical highlight lost — styles.test "keeps the highlights…" RED→GREEN, suite 244/244
- leftover dragon copy + old theme colour — styles.test "manifest, theme colour and settings copy" RED→GREEN, suite 244/244

### Deferred minors
- reactions last the whole feedback phase (REACTION_MS unused; spec says ~1 s)
- 哼，来吧！/喵！ bubbles never shown; close-up for a hard writing word not wired; close-up shows whole Truffle not just face
- ink-cascade leftovers — sticker gold/dashed (replaced in plan 2), speak--big/fishtile blue-edge shadows, pale press shadows, parent links now ink, dead .choice.is-right/.is-oops selectors, Scene band prop no-op
- HoldButton — no onBlur cancel for keyboard, multi-touch lift cancels, ring CSS ignores holdMs
- test gaps — 1199 ms release, keyup cancel, Closeup auto-hide, SessionScreen cooldown wiring
- built-in single-char readings 了 liǎo / 得 dé (dictionary citation readings) vs the everyday le/de a P2 child meets — content question
- a tap on the chest art does nothing (children used to tapping); consider a shake + hold hint

## Plan 2-powers

### Rulings
- Task 3: Ruling: the power character moved from the cape (hidden behind the body) to a chest emblem on the front layer; test asserts .truffle__cape in back and .truffle__emblem in front — spec §5 "cape or pattern" satisfied, character visible — cost if wrong: art placement only
- Task 3: Ruling: 💧 mark moved off the cheek (read as a tear in the visual check) to above the ear; only 💗 sits on the cheek — cost if wrong: none
- Task 5: Ruling: home.test edit initially duplicated a Wardrobe block (anchor matched an earlier describe) — repaired before commit; obsolete StickerBook tests removed (replaced by CollectionScreen tests) — cost if wrong: none
- Task 7: Ruling: powers earned before this release unlock at the next completed session's celebration (not retroactively on Home) — keeps one celebratory moment per tier — cost if wrong: an existing child waits one session to see powers
- Final: Ruling: spec §6 "power mastered" badge not added — power mastery is already celebrated by the tier-3 power-up (full form + 新能力); radical-family badges stay as collection badges — cost if wrong: no separate 🏅 for mastering a power
- Final: Ruling: 600-card collection paint/scroll perf on an older iPad (declined: no device) — no stagger animation, memoised list; check on the real iPad — cost if wrong: janky scrolling on the collection
- Final: Ruling: grain filter covers the whole Truffle at tier ≥ 2 (declined) — Truffle ≤ 360px, not a large screen area per spec §12 — cost if wrong: slower Truffle render on an old iPad
- Final: Ruling: mark/aura/cape placement vs accessories (declined: not rendered) — walkthrough + costume gallery rendered tiers with outfits and accessories; no clipping seen — cost if wrong: an overlap on some combination
- Final: Ruling: fire/metal go 0 → tier 2 at 3 known (declined: plan rule) — stands — cost if wrong: tier 1 skipped for tiny families
- Final: Ruling: example word only in the big card view, not on the small card (declined: plan decision) — small cards stay legible at 104px — cost if wrong: one extra tap to see the example
- Final: Ruling: uncaught no-power cards show ？ (declined: cosmetic) — stands — cost if wrong: none
- Final: Ruling: walkthrough landscape/reduced-motion/tier-in-lesson not ledgered (declined: process) — tiers 1–3 checked on Home/room; landscape + reduced motion re-checked in plan 3's walkthrough — cost if wrong: an unseen layout issue

### Fixed in the final review
- review-focus 4 untested — celebration "saves every new tier, shows the highest, and only then offers 继续" added; GREEN on first run (behaviour already correct; coverage gap only), suite 266/266
- failed save strands the child — celebration "never strands the child if saving fails" + "still lets the child continue if the chest cannot be saved" RED→GREEN, suite 266/266
- gold-card stars invisible — styles.test "stars on gold cards are ink" RED→GREEN, suite 266/266
- 金卡 chip off-screen — home "puts the 金卡 filter right after 全部" RED→GREEN, suite 266/266
- close-up drops his power — FlashcardStep "shows his power in the close-up" RED→GREEN, suite 266/266
- "金 = 金" — radicals "has a meaning for 金" RED→GREEN, suite 266/266

### Deferred minors
- 400 of 600 cards are "rare" (levels 2 and 3); rare frame hard to see
- card dialog lacks aria-modal / focus management / Escape
- ~525 disabled 未收集 buttons are noisy for VoiceOver; tapping a face-down card gives no feedback
- room tabs lack aria-controls/arrow keys; power row label omits tier/ready state
- power mark drawn outside the head tilt group (drifts ~6px on lookAt)
- dead sticker-book CSS (.book, .family*, .sticker*)
- test gaps — newTiers with seen > computed, zero-known collection, gold filter, tapping a caught card, unknown activePower

## Plan 3-costumes

### Rulings
- Task 1: Ruling: chest logic moved from pet.ts to costumes.ts; pet.test chest cases deleted (superseded by costumes.test); celebration prize test now expects the first-chest zodiac onesie (龙 default) — spec §7 first-chest rule — cost if wrong: none
- Task 2: Ruling: costumeLayer gained `back` (hero cape behind the body) and `hidesEars` (Truffle's ears hidden under onesie hoods — gallery showed grey ear tips poking through; test RED→GREEN) — cost if wrong: none
- Task 2: Ruling: rabbit ears drawn as lop ears down the sides — Truffle's viewBox top is y=20, upright ears would clip — cost if wrong: art only
- Task 3: Ruling: styles.test 'no dragon' contract narrowed to pet-dragon wording — the zodiac option 'Dragon 龙' is legitimate — cost if wrong: none
- Task 4: Ruling: all 16 accessories shown (locked ones greyed + disabled) instead of owned-only — consistent with locked costume silhouettes (spec §7 room) — cost if wrong: a longer grid
- Task 5: Ruling: reduced motion still not emulatable in the pane; landscape room check skipped (same grid CSS as the collection checked in plan 2) — cost if wrong: an unseen layout issue in landscape
- Final: Ruling: outfits hide head-top accessories (spec only says onesies hide the slot) — every outfit has its own head piece; a 🎩 over the chef hat looked broken — cost if wrong: a child can't combine e.g. explorer + 👑
- Final: Ruling: locked costumes shown as a 🔒 swatch + name, not Truffle silhouettes (spec §7) — 20 thumbnail Truffles would mean 20 grain filters on an old iPad — cost if wrong: the child can't preview a locked costume's look
- Final: Ruling: newly won costumes are not auto-worn (declined: UX) — the prize shows Truffle wearing it; the child chooses in his room — cost if wrong: he must visit the room to wear it
- Final: Ruling: zodiac label after the first chest still describes the gift (declined: UX) — stands — cost if wrong: a parent changes it expecting a new onesie
- Final: Ruling: default 龙 on the existing install unless Zodiac is set first (declined) — parent asked to set it before release — cost if wrong: the one-time gift is the wrong animal
- Final: Ruling: power marks overlap hats / tier-3 emblem covers the hero 字 (declined: spec "power always shows") — stands — cost if wrong: a busy-looking combination
- Final: Ruling: tier-2 aura/cape past the viewBox, Wardrobe save without error handling, room tabs without aria-controls (declined: pre-existing) — stand — cost if wrong: minor
- Final: Ruling: reduced motion and landscape room not exercised (declined) — not emulatable / same grid CSS as collection — cost if wrong: an unseen layout issue
- Final: Ruling: art taste (squat wizard hat, band bicorne, lop rabbit) (declined) — stands — cost if wrong: art polish

### Fixed in the final review
- power-up drops the costume and shows the hidden accessory — celebration "keeps the onesie on and the hidden accessory hidden" RED→GREEN, suite 271/271
- costume names without pinyin — home "shows pinyin on costume names, toggles accessories, and explains…" RED→GREEN, suite 271/271
- accessory tap toggle + aria-pressed, note moved into 小东西 — same test RED→GREEN, suite 271/271
- hat on a hat — costumes "a onesie hides the accessory" (now also: outfits hide head-top accessories; glasses/scarf still show) RED→GREEN, suite 271/271
- unknown zodiac / unknown owned ids skipping or corrupting the first-chest gift — costumes "ignores an unknown zodiac or unknown owned ids" RED→GREEN, suite 271/271

### Deferred minors
- owned costumes show a colour dot, not a preview of the look
- monkey ears / dragon & horse tips a few units past the 260×270 viewBox (visible only because overflow is visible; grain trims the outer half-stroke)
- pixel outfit lacks the planned square glasses
- types.ts imports ZodiacId from fun/costumes (type-only cycle); ChestResult costume id typed as string
- plan 3 text says first chest needs "no lastChestDate" — contradicts its own Review Focus; code follows the spec
- test gaps — same-seed replay after first chest, 👑 reappearing after the onesie comes off, backup asserting ownedCostumes/outfit defaults, locked accessories disabled
