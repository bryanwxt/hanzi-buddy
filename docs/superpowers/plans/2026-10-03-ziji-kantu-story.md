# 字己 Plan 9 — 看图说话 story builder + Truffle asks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On alternate lessons, the speaking step is a 看图说话 story builder. He gets 8 built-in ink scenes, five framed parts each (try first, then compare with Truffle's model), a whole-story rehearsal, and 2–3 "Truffle asks" questions. Everything is recorded and grouped for the parent.

**Architecture:**
- **Content** (`src/kantu/scenes.ts`): pure data, with titles, theme words, model parts and questions.
- **Art** (`src/ui/kantu/art.ts`): one SVG markup string per scene.
- **Logic** (`src/kantu/flow.ts`): pure helpers for the alternation, the scene order and the fading.
- **UI:**
  - `StoryStep` drives the screens;
  - the recorder hook and mic button move out of `LangduStep` into a shared module, so both steps use one tested implementation.
- **Session** picks 朗读 or 看图说话 per lesson.
- **Recordings** groups a story's recordings.

**Tech Stack:** Vite 7, Preact 10, TypeScript 5.9, Vitest 4 (jsdom, fake-indexeddb).

**Spec:** `docs/superpowers/specs/2026-10-02-ziji-truffle-design.md` §17 (and §13 ink rules, §16 for the 朗读 step it alternates with).

## Global Constraints

- **Scene ids, in this order:** `vase`, `wallet`, `grandma`, `queue`, `litter`, `share`, `fall`, `spill`.
- **Parts, in this order:** `opening` 开场白, `setting` 时间地点人物, `events` 经过, `ending` 结果, `opinion` 看法. Guiding questions and starters, exactly:

  | part | guiding question | starter |
  |---|---|---|
  | `opening` | 图上画的是什么？ | 图上画的是… |
  | `setting` | 什么时候？在哪里？有谁？ | 有一天，…在… |
  | `events` | 发生了什么事？ | 突然，… |
  | `ending` | 后来怎么样了？ | 后来，… |
  | `opinion` | 你觉得怎么样？为什么？ | 我觉得…，因为… |

- **Alternation:**
  - `kid.speakingLast` records the last activity: `'langdu' | 'story' | null`.
  - Next is `'story'` unless the last was `'story'`; null → `'story'`.
  - If the chosen activity can't run (no 朗读 passage), use the other.
  - The parent's `speaking` toggle covers both. Home 多读一遍 (read it once more) stays 朗读 only.
- **Fading:** starters show while `kid.story.told < 8`. After that they hide behind a hint button (💡 is an emoji, so use `InkIcon name="sparkle"`), labelled `提示` ("hint").
- **Stars:** the step's normal star only; no bonus.
- **Recordings:** `{ kind: 'story'; sceneId: string; part: StoryPart | 'whole' }` and `{ kind: 'answer'; sceneId: string; question: number }`.
- **Art:** §13 ink rules (outline `#2a2630`, flat palette fills, no gradients or filters), a 360×270 canvas, simple ink children (round heads, dot eyes, simple bodies), no IP.
- **No emoji in child source:** the `childEmoji.test.ts` contract applies. Every child-facing Chinese string goes through `Label`.
- **Publishing:** never push or deploy without the parent's go-ahead in chat.

## Review Focus

1. **Microphone refused:** every part, the whole telling and every answer show the "麦克风没有打开" note and still let him go on. 听松露说 ("hear Truffle say it") still plays. The step completes with its star.
2. **Alternation across days:**
   - a 朗读 day, then a story day, then a 朗读 day;
   - a day where the 朗读 pool is empty always runs the story;
   - the 朗读 3-day cycle only advances on 朗读 days.
3. **Leaving mid-story** (the X button, the app closed) doesn't advance `story.next` or `told`, and doesn't flip `speakingLast`. The same scene comes back next time.
4. **Old kid data** without `speakingLast` or `story` gets defaults. Old recordings of kinds `picture`, `passage` and `intro` still list as before.
5. **Double taps** on 继续 (continue) or 完成 (done) never skip a part or save twice. `onDone` fires once.

---

### Task 1: Scene art + gallery

**Files:**
- Create: `src/ui/kantu/art.ts`, `src/ui/kantu/art.test.ts`

**Interfaces:**
- Produces:
  - `export type SceneId = 'vase' | 'wallet' | 'grandma' | 'queue' | 'litter' | 'share' | 'fall' | 'spill';`
  - `export const SCENE_IDS: SceneId[]` (in the constraint order);
  - `export const SCENE_ART: Record<SceneId, string>` (inner SVG markup for `viewBox="0 0 360 270"`);
  - `export const SCENE_VIEW = '0 0 360 270'`.

**Compositions** (each a full scene, readable at about 340 px wide):
- **`vase`:** a shop counter with shelves. A boy with an arm out, a vase tipping off a low table, three shards with motion marks. A shopkeeper (adult, apron) behind the counter.
- **`wallet`:** a park path with a bench and tree. A girl bending to pick up a brown wallet. Further off, a man patting his pockets (the owner).
- **`grandma`:** a zebra crossing, with a traffic light showing green. An elderly lady with a walking stick and a shopping bag, two children holding her arm.
- **`queue`:** a canteen counter with a menu board. A line of 4 children; one boy darting in at the front (motion lines). A girl at the back pointing.
- **`litter`:** park grass and a bin. A boy tossing a wrapper, a girl picking one up, a bin with a lid.
- **`share`:** classroom desks. One child with an empty lunch box looking sad, another holding out half a sandwich.
- **`fall`:** playground tarmac with a running track line. A child on the ground holding a knee (red scrape), a friend kneeling to help, a teacher figure and a sick-bay sign (red cross on white) in the background.
- **`spill`:** canteen. One boy with a cup mid-collision, a drink splash (blue drops) onto a girl's shirt, both startled.

- [ ] **Step 1: Failing test** (`art.test.ts`):
  - every id in `SCENE_IDS` has markup longer than 600 characters;
  - it contains `#2a2630`;
  - it has no `Gradient`, `<filter` or `url(#)`;
  - `SCENE_IDS` equals the constraint order.
- [ ] **Step 2: Run** `npx vitest run src/ui/kantu`. Expected: FAIL (module missing).
- [ ] **Step 3: Draw** the eight scenes.
  - A small set of helpers keeps the people consistent: `kid(x, y, { shirt, hair, pose })`, `adult(...)` and `elder(...)`. Each returns markup with ink outlines, a round head, dot eyes, a small mouth and simple limbs.
  - The palette: green `#7fdc7a`, blue `#4aa3ff`, red `#ff5532`, marigold `#ffc94a`, pink `#ffb3c1`, cream `#fffaf0`, brown `#c98a4b`, greys `#d4c7ae` and `#8f8a93`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Gallery.** Render all eight, each with its title, to the visual companion (a temporary vitest file in `src/tmpgallery/` that writes HTML to `$OUT`, deleted afterwards). Check each reads clearly: who, where, what happened. Iterate until it does.
- [ ] **Step 6: Commit** `feat(kantu): ink art for the eight 看图说话 scenes`.

### Task 2: Scene content + flow logic + kid fields

**Files:**
- Create: `src/kantu/scenes.ts`, `src/kantu/flow.ts`, `src/kantu/kantu.test.ts`
- Modify:
  - `src/types.ts`: `KidState` gains `speakingLast: 'langdu' | 'story' | null` (default null) and `story: { next: number; told: number }` (default `{ next: 0, told: 0 }`); `RecordingPrompt` gains the two kinds;
  - `src/store/repo.ts`: `normalizeKid` validates both;
  - `src/store/repo.test.ts`.

**Interfaces:**
- Produces:

```ts
// scenes.ts
export type StoryPart = 'opening' | 'setting' | 'events' | 'ending' | 'opinion';
export const STORY_PARTS: { part: StoryPart; question: string; starter: string }[]; // the constraint table
export interface Scene { id: SceneId; title: string; words: string[]; model: Record<StoryPart, string>; questions: { q: string; starter: string; answer: string }[] }
export const SCENES_KT: Scene[]; // in SCENE_IDS order
// flow.ts
export function nextSpeaking(last: 'langdu' | 'story' | null, langduAvailable: boolean): 'langdu' | 'story';
export function sceneFor(story: { next: number }): Scene;      // SCENES_KT[next % 8]
export function afterStory(story: { next: number; told: number }): { next: number; told: number }; // next+1, told+1
export const STARTERS_UNTIL = 8;
export function showStarters(told: number): boolean;          // told < 8
```

**Content** (use exactly):

| id | title | words |
|---|---|---|
| vase | 打翻花瓶 | 打翻 花瓶 诚实 道歉 老板 |
| wallet | 捡到钱包 | 捡到 钱包 还给 失主 谢谢 |
| grandma | 帮助老奶奶 | 帮助 老奶奶 过马路 小心 红绿灯 |
| queue | 排队 | 排队 插队 食堂 等一等 不对 |
| litter | 乱丢垃圾 | 垃圾 乱丢 捡起来 垃圾桶 公园 |
| share | 分享午饭 | 分享 午饭 忘了 一起 开心 |
| fall | 跌倒了 | 跌倒 受伤 扶起来 医务室 关心 |
| spill | 撞到人 | 撞到 打翻 饮料 对不起 没关系 |

Model parts (opening / setting / events / ending / opinion):
- **vase:**
  - opening: 图上画的是一个小男孩在商店里打翻了花瓶。
  - setting: 有一天下午，小明和妈妈在商店里买东西。
  - events: 突然，小明不小心碰到了桌子，桌上的花瓶掉下来，打翻了。
  - ending: 后来，小明马上向老板道歉，说："对不起，是我打翻的。"老板说："没关系，你很诚实。"
  - opinion: 我觉得小明是一个诚实的孩子，因为他做错了事敢承认。
- **wallet:**
  - opening: 图上画的是一个小女孩在公园里捡到了一个钱包。
  - setting: 星期六早上，小红在公园里散步。
  - events: 突然，她看见地上有一个钱包。
  - ending: 后来，小红把钱包还给了失主。失主很高兴，对她说："谢谢你！"
  - opinion: 我觉得小红做得很对，因为别人的东西要还给别人。
- **grandma:**
  - opening: 图上画的是两个小学生帮助老奶奶过马路。
  - setting: 有一天放学后，小明和小华走在回家的路上。
  - events: 他们看见一位老奶奶提着很重的东西，站在马路边，不敢过马路。
  - ending: 后来，他们扶着老奶奶，等绿灯亮了，小心地走过马路。老奶奶笑着说："你们真是好孩子！"
  - opinion: 我觉得他们很有爱心，因为他们主动帮助别人。
- **queue:**
  - opening: 图上画的是同学们在食堂排队买东西。
  - setting: 有一天休息的时候，很多同学在学校食堂排队。
  - events: 突然，一个男孩跑过来，插队站到了前面。
  - ending: 后来，小华对他说："请你到后面排队。"男孩不好意思地走到了后面。
  - opinion: 我觉得插队是不对的，因为大家都在等。
- **litter:**
  - opening: 图上画的是一个孩子在公园里乱丢垃圾。
  - setting: 星期天下午，很多人在公园里玩。
  - events: 一个男孩吃完饼干，把包装纸乱丢在地上。
  - ending: 后来，一个女孩把垃圾捡起来，丢进了垃圾桶。男孩看见了，很不好意思。
  - opinion: 我觉得我们不应该乱丢垃圾，因为公园是大家的。
- **share:**
  - opening: 图上画的是两个同学在一起吃午饭。
  - setting: 有一天中午，同学们在教室里吃午饭。
  - events: 小明发现小华忘了带午饭，他很饿，也很难过。
  - ending: 后来，小明把自己的面包分一半给小华。两个人一起吃，都很开心。
  - opinion: 我觉得小明很好，因为他愿意和朋友分享。
- **fall:**
  - opening: 图上画的是一个小朋友在操场上跌倒了。
  - setting: 有一天上体育课，同学们在操场上跑步。
  - events: 突然，小华跌倒了，膝盖受伤了，他哭了起来。
  - ending: 后来，小明马上把他扶起来，送他去医务室。
  - opinion: 我觉得小明很关心同学，因为他马上帮助受伤的朋友。
- **spill:**
  - opening: 图上画的是一个小男孩撞到了别人，饮料打翻了。
  - setting: 有一天在食堂，小明拿着饮料走回座位。
  - events: 他走得太快，撞到了小红，饮料打翻在小红的衣服上。
  - ending: 后来，小明马上说："对不起！"还帮小红擦衣服。小红说："没关系。"
  - opinion: 我觉得小明做得很好，因为他做错了事会马上道歉。

Questions (q / starter / answer):
- **vase:**
  - 如果你是小明，你会怎么做？为什么？ / 我会…，因为… / 我会马上向老板道歉，因为做错了事要诚实。
  - 你有没有不小心打翻过东西？ / 有一次，我… / 有一次，我打翻了水杯，我马上告诉妈妈，还把桌子擦干净了。
- **wallet:**
  - 如果你捡到钱包，你会怎么做？ / 我会…，因为… / 我会把钱包交给警察，因为失主一定很着急。
  - 为什么我们要把东西还给失主？ / 我觉得…，因为… / 我觉得要还给失主，因为丢了东西的人会很难过。
- **grandma:**
  - 你帮助过别人吗？你做了什么？ / 我… / 我帮奶奶拿过东西，她很开心。
  - 过马路的时候，我们要注意什么？ / 我们要… / 我们要看红绿灯，绿灯亮了才走。
- **queue:**
  - 如果有人插队，你会怎么做？ / 我会…，因为… / 我会有礼貌地请他到后面排队，因为排队才公平。
  - 为什么我们要排队？ / 我觉得…，因为… / 我觉得要排队，因为这样大家都不会乱。
- **litter:**
  - 如果你看见有人乱丢垃圾，你会说什么？ / 我会说… / 我会说："请你把垃圾丢进垃圾桶。"
  - 你怎样保持公园干净？ / 我会… / 我会把垃圾丢进垃圾桶。
- **share:**
  - 你和别人分享过什么？ / 我和…分享过… / 我和弟弟分享过我的玩具。
  - 如果你的朋友忘了带东西，你会怎么做？ / 我会…，因为… / 我会借给他，因为朋友要互相帮助。
- **fall:**
  - 如果你的同学跌倒了，你会怎么做？ / 我会…，因为… / 我会把他扶起来，送他去医务室，因为他受伤了。
  - 在操场上玩的时候，我们要注意什么？ / 我们要… / 我们要小心，不要推别人。
- **spill:**
  - 如果你撞到了别人，你会说什么？ / 我会说… / 我会说："对不起，你没事吧？"
  - 别人向你道歉的时候，你会怎么说？ / 我会说… / 我会说："没关系。"

- [ ] **Step 1: Failing tests** (`kantu.test.ts`):
  - `SCENES_KT` ids equal `SCENE_IDS`;
  - every scene has 5 words, all five model parts non-empty, and 2–3 questions;
  - every child-facing string is Han characters plus Chinese punctuation (`，。！？：""…、`);
  - `nextSpeaking(null, true) === 'story'`, `nextSpeaking('story', true) === 'langdu'`, `nextSpeaking('langdu', true) === 'story'`, `nextSpeaking('story', false) === 'story'`;
  - `sceneFor({ next: 9 }).id === 'wallet'`;
  - `afterStory({ next: 7, told: 3 })` equals `{ next: 8, told: 4 }`;
  - `showStarters(7) === true`, `showStarters(8) === false`.

  In `repo.test.ts`: `normalizeKid({})` gives `speakingLast: null, story: { next: 0, told: 0 }`; bad values (a string `story`, `speakingLast: 'x'`) become defaults.
- [ ] **Step 2: Run** `npx vitest run src/kantu src/store`. Expected: FAIL.
- [ ] **Step 3: Implement** (content exactly as above; `normalizeKid` keeps non-negative integers only).
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green (update whole-KidState comparisons with the new defaults).
- [ ] **Step 5: Commit** `feat(kantu): eight scenes' words, model stories and questions; alternation and fading rules`.

### Task 3: Shared recorder hook

**Files:**
- Create: `src/activities/shared/recording.tsx` (`useRecorder` and `MicButton` moved out of `LangduStep.tsx`, unchanged in behaviour)
- Modify: `src/activities/langdu/LangduStep.tsx` (import them)
- Test: `src/activities/shared/recording.test.tsx`

**Interfaces:**
- Produces: `export function useRecorder(): { state: 'ready' | 'recording' | 'done' | 'blocked'; result; level; quietMs; heard; start(withLevel: boolean): Promise<void>; stop(): Promise<void>; reset(): void }`, plus `export function MicButton({ rec, withLevel })` and `export const BLOCKED_NOTE`.

- [ ] **Step 1: Failing test:** a tiny harness component using `useRecorder` and `MicButton`:
  - one tap → one recording, and `state` becomes `done` after 停止 (stop);
  - a double tap while the mic is opening → `startRecording` called once;
  - `recordingSupported` false → the blocked note.
- [ ] **Step 2: Run.** Expected: FAIL (module missing).
- [ ] **Step 3: Move** the code. The LangduStep tests stay green unchanged.
- [ ] **Step 4: Run** `npx vitest run src/activities`. Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `refactor: share the recorder hook and mic button between 朗读 and 看图说话`.

### Task 4: StoryStep (five parts → whole story → Truffle asks)

**Files:**
- Create: `src/activities/kantu/StoryStep.tsx`, `src/activities/kantu/StoryStep.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `Scene`, `STORY_PARTS`, `showStarters` (Task 2); `SCENE_ART`, `SCENE_VIEW` (Task 1); `useRecorder`, `MicButton`, `BLOCKED_NOTE` (Task 3); `speak`, `Label`, `BottomBar`, `InkIcon`.
- Produces:

```ts
export interface StoryResult {
  parts: Partial<Record<StoryPart, FinishedRecording>>;
  whole: FinishedRecording | null;
  answers: (FinishedRecording | null)[];
}
export function StoryStep(props: { scene: Scene; told: number; kid: KidState; onDone: (r: StoryResult) => void }): JSX.Element;
```

**Screens:**
1. **Each part** (`STORY_PARTS` order):
   - the picture (`<svg class="kantu__pic" viewBox={SCENE_VIEW}>`);
   - the guiding question (a `Label`, spoken on enter);
   - the starter (a `Label`; hidden behind a `提示` button when `!showStarters(told)`);
   - word chips (each a button that speaks the word);
   - a `MicButton` (no meter);
   - after a recording (or when blocked), a `听松露说` button that speaks `scene.model[part]` and shows it as a `Label` under the picture.

   BottomBar `继续` is enabled when the recorder is `done` or `blocked`. 重录 (re-record) resets the recorder. Each part uses a fresh recorder: key the part screen by part.
2. **讲一讲** (tell it all): the picture only, with the heading `讲一讲` and `Label` "看着图，把故事讲一遍" ("look at the picture and tell the whole story"). Then a mic, and 继续.
3. **Truffle asks** (each question): `Pet` with the bubble `松露问你`, the question as a `Label` (spoken), the starter `Label` (subject to the same fading), a mic, and `听松露说` (the model answer) after a recording. The BottomBar on the last question is `完成`.
4. **`onDone`** fires once (guard it with a ref) with every recording collected.

- [ ] **Step 1: Failing tests** (mock `../../audio/recorder` and `../../audio/speech`, as in `LangduStep.test.tsx`):

```tsx
it('walks the five parts, the whole story and the questions, then reports every recording once', async () => {
  // render StoryStep with SCENES_KT[0] (vase), told=0
  // for each of 5 parts: guiding question shows (getByText(question)), starter shows, record once, 听松露说 → speak called with the model part, 继续
  // 讲一讲 screen: record, 继续
  // 2 questions: question text shows, record, 听松露说 → speak(answer), 继续 / 完成
  // onDone called once with parts having 5 keys, whole non-null, answers length 2 all non-null
  // double-click 完成 → still called once
});
it('after 8 stories the starter hides behind 提示', () => {
  // told=8: starter text absent; click 提示 → starter shows
});
it('word chips speak their word', () => {
  // click chip 花瓶 → speak('花瓶')
});
it('without a microphone every screen explains and still lets him finish', () => {
  // recordingSupported false → BLOCKED_NOTE shows, 继续 enabled on every screen, 听松露说 available, onDone({ parts: {}, whole: null, answers: [null, null] })
});
```

(Write these out in full in the style of `LangduStep.test.tsx`, with a `recordOnce()` helper. Every assertion named in the comments must be real.)
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement**, with CSS: the picture in an ink panel (max-width 560 px, aspect 4:3), word chips as small pill buttons, starter text larger in the hanzi font.
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(kantu): story builder — five framed parts, try then hear Truffle, whole story, Truffle asks`.

### Task 5: Session alternation + saving

**Files:**
- Modify: `src/app/SessionScreen.tsx`
- Test: `src/app/kantuSession.test.tsx` (new, with its own recorder mock)

**Behaviour:**
- **On load:**
  - compute `langdu` (as now: `pickPassage` → passage or null);
  - `const which = nextSpeaking(kid.speakingLast, !!langdu)`;
  - state gets `speaking: { kind: 'langdu', passage, oral } | { kind: 'story', scene: sceneFor(kid.story) }` (replacing `reading`).
- **Render:** `LangduStep` or `StoryStep` accordingly.
- **`onStoryDone`** (once-guarded):
  1. Save each part as `{ kind: 'story', sceneId, part }`, the whole as `part: 'whole'`, and the answers as `{ kind: 'answer', sceneId, question: i }`, all with the same `createdAt` base plus an index (so they sort and group).
  2. Re-read the kid; save `story: afterStory(kid.story)` and `speakingLast: 'story'`.
  3. Finish the step.
- **`onLangduDone`** also saves `speakingLast: 'langdu'`.

- [ ] **Step 1: Failing tests:**
  - a fresh kid (`speakingLast` null) with a parent passage → the session shows the vase story (its first guiding question 图上画的是什么？);
  - completing it → `kid.story` `{ next: 1, told: 1 }`, `speakingLast` `'story'`, 8 recordings (5 parts + whole + 2 answers) with the right prompt kinds;
  - a kid with `speakingLast: 'story'` and a parent passage → the 朗读 warm-up shows (老师好！);
  - a kid with `speakingLast: 'story'` and NO passages (fresh db, no parent passages, no known characters) → the story runs again.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Update `langduSession.test.tsx` so its kid starts with `speakingLast: 'story'` (it tests the 朗读 day).
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(kantu): the speaking step alternates 朗读 and 看图说话; stories saved and counted`.

### Task 6: Parent — story recordings grouped

**Files:**
- Modify: `src/parent/RecordingsPanel.tsx`
- Test: `src/parent/storyRecordings.test.tsx`

**Behaviour:**
- Consecutive `story` and `answer` recordings with the same `sceneId` and created within 30 minutes of each other form one group.
- **The group row:** `🖼️ {title}`, the date, a total duration, and a `Show parts` toggle that lists each recording with a label and an `<audio>`:
  - parts: `开场白`, `时间地点人物`, `经过`, `结果`, `看法`;
  - `讲一讲 (whole story)`;
  - answers: `Q1 …` / `Q2 …`, each with its question text.
- `Delete` on the group removes all of them, after confirm.
- Other recordings list as before.

- [ ] **Step 1: Failing test:**
  - seed 8 story/answer recordings for `vase` and 1 passage recording → the table shows 2 rows (one `🖼️ 打翻花瓶`, one `📖 …`);
  - `Show parts` lists 8 audio elements with the part labels;
  - Delete (confirm stubbed) removes all 8.

  Stub `URL.createObjectURL`, as in `misreadsPanel.test.tsx`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** (a pure `groupRecordings(recs): Array<{ kind: 'single'; rec } | { kind: 'story'; sceneId; recs }>`, unit-tested in the same file).
- [ ] **Step 4: Run.** Expected: PASS. Then `npm test`. Expected: green.
- [ ] **Step 5: Commit** `feat(parent): story recordings grouped by scene`.

### Task 7: Walkthrough + docs

- [ ] In the browser at 768×1024 and 1024×768, on the seed profile (save and restore its session and settings, as in plan 8's walkthrough), with the speaking step only:
  - the story day: each part, the hint button after 8 (set `told` to 8 in the dev DB), word chips, 听松露说, 讲一讲, the questions, completion;
  - the next lesson is 朗读.
- [ ] Check Review Focus 1–5. Fix findings with TDD.
- [ ] Update `README.md`: the speaking step alternates 朗读 and 看图说话.
- [ ] `npm test && npm run build`. Expected: green, then built. **Commit** `docs: 看图说话 story builder in README`.
