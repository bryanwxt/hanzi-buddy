/* Fit sweep (spec §18): every child screen and lesson step must fit one screen in WebKit, the engine of the iPad and iPhone.
   Run: npm run fit  (builds, serves dist on :4174, walks every flow at every size, writes fit-shots/). Exit 1 on any problem. */
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { webkit, type Browser, type Page } from 'playwright-core';
import { WORLDS } from '../src/fun/worlds';
import { buildFitProfile, type FitProfileOptions } from './fit-profile';

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}/`;
const OUT = 'fit-shots';
const AFTERNOON = new Date(2026, 9, 6, 16, 0);
const EVENING = new Date(2026, 9, 6, 21, 0); // timeOfDay() calls this 'evening': the darkest wash
const SIZES = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-15', width: 390, height: 844 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'ipad-air-landscape', width: 1180, height: 820 },
];
type Size = (typeof SIZES)[number];
interface Result { size: string; flow: string; step: number; sig: string; problems: string[] }
const results: Result[] = [];
const ONLY = process.env.FIT_ONLY ? new RegExp(process.env.FIT_ONLY) : null; // e.g. FIT_ONLY=home npm run fit

/* ---------- in-page probes (plain JS: they run inside WebKit) ---------- */
const MAIN = '.choice, .bottombar .btn, .path__node, .mic-btn, .tabbar__item, .fishtile, .bubble-opt';
const SCROLLERS = '.scroll-panel, .filters, .kantu__words, .passage, .langdu__passage';

function probe(args: { main: string; scrollers: string }): string[] {
  const out: string[] = [];
  const de = document.documentElement;
  if (de.scrollHeight > innerHeight + 1) out.push(`page scrolls ${de.scrollHeight - innerHeight}px`);
  if (de.scrollWidth > innerWidth + 1) out.push(`page scrolls sideways ${de.scrollWidth - innerWidth}px`);
  const name = (el: Element) => (el.getAttribute('aria-label') || el.textContent || el.className.toString()).trim().slice(0, 24);
  const mainMin = innerWidth < 600 ? 52 : 64;
  for (const el of document.querySelectorAll('button, [role="button"], [role="tab"], a[href], input, select, textarea')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || el.closest('[aria-hidden="true"], .sr-only, .world-taps') || getComputedStyle(el).visibility === 'hidden') continue;
    if (!el.parentElement?.closest(args.scrollers) && (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1)) out.push(`off screen: ${name(el)}`);
    if (Math.min(r.width, r.height) < 43.5) out.push(`under 44px: ${name(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    if (el.matches(args.main) && Math.min(r.width, r.height) < mainMin - 0.5) out.push(`main action under ${mainMin}px: ${name(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  const small = new Set<string>();
  for (const el of document.querySelectorAll('.label__ch')) {
    const r = el.getBoundingClientRect();
    if (!r.width || el.closest('[aria-hidden="true"], .world-taps, .sr-only')) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 15.5) small.add(`Chinese text under 16px: ${(el.parentElement?.closest('.label')?.textContent ?? el.textContent ?? '').slice(0, 12)} ${fs}px`);
  }
  out.push(...small);
  // solid things must not sit on each other (the eye catches this; scroll and size checks don't)
  const solid = [...document.querySelectorAll('button, h1, h2, .card, .goal, .pet__bubble, svg.truffle, .path__name, .week, .stat, .home__who, .passage, .tianzige, .intro__card, .hanzi--xl, .langdu__phrase, .kantu__pic')]
    .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[aria-hidden="true"]:not(.truffle):not(.pet), .arrival, .zika-big, .closeup, .rotate-hint, .world-taps, .particles') && getComputedStyle(el).visibility !== 'hidden'; });
  const seenPair = new Set<string>();
  for (let a = 0; a < solid.length; a++) for (let b = a + 1; b < solid.length; b++) {
    const A = solid[a]!, B = solid[b]!;
    if (A.contains(B) || B.contains(A)) continue;
    const ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect();
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w > 6 && h > 6) { const key = `${name(A)} × ${name(B)}`; if (!seenPair.has(key)) { seenPair.add(key); out.push(`overlap: ${key}`); } }
  }
  for (const t of document.querySelectorAll('.world-taps .tap > *')) {
    const r = t.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!top?.closest('.world-taps .tap')) out.push(`world tap at ${Math.round(r.left + r.width / 2)},${Math.round(r.top + r.height / 2)} covered by ${top ? (typeof top.className === 'string' ? top.className : top.tagName) || top.tagName : 'nothing (off screen)'}`);
  }
  return out;
}

function signature(): string {
  const s = document.querySelector('.screen');
  const marks = ['.home', '.flash', '.intro', '.write', '.components', '.pond', '.bubbles', '.langdu', '.kantu', '.kantu__ask', '.kantu__model', '.celebrate', '.chest', '.room', '.zika-grid', '.setup', '.pinpad', '.choices', '.arrival', '.zika-big', '.rotate-hint'];
  const on = marks.filter((m) => s?.matches(m) || s?.querySelector(m) || document.querySelector(`${m}:not(.rotate-hint)`));
  const tone = document.querySelector('.bottombar')?.className ?? '';
  const words = (s?.querySelector('.kantu__q, .langdu__step, .pet__bubble, h1, h2')?.textContent ?? '').slice(0, 14);
  return `${on.join(',')}|${tone}|${words}`;
}

/** One forward tap through a lesson. Returns false when nothing could be tapped. */
function advance(): boolean {
  const vis = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const enabled = (el: Element) => !(el as HTMLButtonElement).disabled;
  const first = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)].find((e) => vis(e) && enabled(e));
  const byText = (t: string) => [...document.querySelectorAll<HTMLButtonElement>('.screen button')].find((b) => vis(b) && enabled(b) && b.textContent?.includes(t));
  const tap = (el: HTMLElement | undefined) => (el ? (el.click(), true) : false);
  if (tap(byText('停止'))) return true;
  if (!document.querySelector('.kantu__model') && tap(byText('听松露说'))) return true; // show the model once: the tallest state
  if (tap(first('.bottombar .btn'))) return true;
  if (tap(byText('开始录音'))) return true;
  for (const t of ['我记住了', '下一句', '开始朗读', '听听你自己', '开始！', '走吧']) if (tap(byText(t))) return true;
  if (tap(first('.choice'))) return true;
  if (tap(first('.fishtile, .bubble-opt, .whichpart__char'))) return true;
  if (tap(first('.chest'))) return true;
  return false;
}

/* ---------- harness ---------- */
async function seed(page: Page, json: string) {
  await page.goto(BASE);
  await page.waitForSelector('.screen:not(.loading)'); // booted: the app has created its database
  await page.evaluate(async (text) => {
    const file = JSON.parse(text);
    const decode = (v: unknown): unknown =>
      Array.isArray(v) ? v.map(decode) : v && typeof v === 'object' ? (typeof (v as { $date?: unknown }).$date === 'string' ? new Date((v as { $date: string }).$date) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decode(x)]))) : v;
    const db: IDBDatabase = await new Promise((ok, no) => { const r = indexedDB.open('hanzi-buddy'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
    const tx = db.transaction([...Object.keys(file.stores), 'settings', 'kid'], 'readwrite');
    for (const [name, rows] of Object.entries(file.stores) as [string, unknown[]][]) { const st = tx.objectStore(name); st.clear(); for (const row of rows) st.put(decode(row)); }
    if (file.settings) tx.objectStore('settings').put(decode(file.settings), 'main'); else tx.objectStore('settings').delete('main');
    if (file.kid) tx.objectStore('kid').put(decode(file.kid), 'main'); else tx.objectStore('kid').delete('main');
    await new Promise((ok, no) => { tx.oncomplete = ok; tx.onerror = () => no(tx.error); });
    db.close();
  }, json);
  await page.reload();
  await page.waitForSelector('.screen:not(.loading)');
  await page.waitForTimeout(600);
}

async function open(browser: Browser, size: Size, now: Date, profile: Omit<FitProfileOptions, 'now'>): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, hasTouch: true, serviceWorkers: 'block' });
  await ctx.clock.setFixedTime(now);
  await ctx.addInitScript({ content: 'window.__name = (f) => f;' }); // tsx (esbuild keepNames) wraps functions in __name(); in-page code needs it to exist
  await ctx.addInitScript(() => {
    // A pretend microphone, so the recorded states (听松露说, 重录) are walked too.
    class FakeRecorder {
      static isTypeSupported() { return true; }
      mimeType = 'audio/mp4'; state = 'inactive';
      ondataavailable: ((e: { data: Blob }) => void) | null = null; onstop: (() => void) | null = null;
      constructor(_s: MediaStream) {}
      start() { this.state = 'recording'; }
      stop() { this.state = 'inactive'; setTimeout(() => { this.ondataavailable?.({ data: new Blob(['x'], { type: 'audio/mp4' }) }); this.onstop?.(); }, 10); }
      addEventListener(t: string, f: () => void) { (this as Record<string, unknown>)[`on${t}`] = f; }
      removeEventListener() {}
    }
    (window as unknown as { MediaRecorder: unknown }).MediaRecorder = FakeRecorder;
    const stream = () => { const ac = new AudioContext(); const o = ac.createOscillator(); const d = ac.createMediaStreamDestination(); o.connect(d); o.start(); return d.stream; };
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => stream() } });
  });
  const page = await ctx.newPage();
  await seed(page, await buildFitProfile({ now, ...profile }));
  return page;
}

async function check(page: Page, size: Size, flow: string, step: number) {
  await page.waitForTimeout(500);
  const sig = await page.evaluate(signature);
  const problems = await page.evaluate(probe, { main: MAIN, scrollers: SCROLLERS });
  mkdirSync(`${OUT}/${size.name}`, { recursive: true });
  await page.screenshot({ path: `${OUT}/${size.name}/${flow}-${String(step).padStart(2, '0')}.png` });
  results.push({ size: size.name, flow, step, sig, problems });
}

async function walkLesson(page: Page, size: Size, flow: string, opts: { firstOnly?: boolean } = {}) {
  const seen = new Set<string>(); // check each distinct screen once; keep walking through repeats (20 phrases, 25 words) to reach the end
  for (let i = 0; i < 150; i++) {
    await page.waitForTimeout(450);
    if (!(await page.$('.lessonbar')) && !(await page.$('.celebrate'))) return; // back home
    const sig = await page.evaluate(signature);
    if (!seen.has(sig)) { seen.add(sig); await check(page, size, flow, i); }
    if (opts.firstOnly) return;
    if (!(await page.evaluate(advance))) return;
  }
}

async function sweep(browser: Browser, size: Size) {
  const run = async (flow: string, now: Date, profile: Omit<FitProfileOptions, 'now'>, then: (p: Page) => Promise<void>) => {
    if (ONLY && !ONLY.test(flow)) return;
    const page = await open(browser, size, now, profile);
    try { await then(page); } catch (e) { results.push({ size: size.name, flow, step: -1, sig: '', problems: [`flow crashed: ${String(e).slice(0, 160)}`] }); }
    await page.context().close();
  };
  const tabTo = (p: Page, label: string) => p.click(`.tabbar__item:has-text("${label}")`);
  const startLesson = async (p: Page) => { await p.click('.path__node--current'); };

  // Home: not started, and done-for-today with every optional card; world taps in every world
  await run('home', AFTERNOON, {}, (p) => check(p, size, 'home', 0));
  await run('home-done', AFTERNOON, { doneToday: true }, (p) => check(p, size, 'home-done', 0));
  for (const w of WORLDS) await run(`home-${w.id}`, AFTERNOON, { world: w.id }, (p) => check(p, size, `home-${w.id}`, 0));
  // First run
  await run('setup-pin', AFTERNOON, { pin: false, kid: false, placementDone: false }, (p) => check(p, size, 'setup-pin', 0));
  await run('pet-setup', AFTERNOON, { kid: false, placementDone: false }, (p) => check(p, size, 'pet-setup', 0));
  await run('placement', AFTERNOON, { placementDone: false }, async (p) => { await check(p, size, 'placement', 0); await p.click('.btn--big'); await check(p, size, 'placement', 1); });
  // Tabs
  await run('collection', AFTERNOON, {}, async (p) => { await tabTo(p, '字卡'); await check(p, size, 'collection', 0); await p.click('.zika:not(.card--back)'); await check(p, size, 'collection', 1); });
  await run('room', AFTERNOON, {}, async (p) => {
    await tabTo(p, '松露');
    await p.waitForSelector('.room__tabs');
    let i = 0;
    for (const tab of await p.$$('.room__tabs [role="tab"], .room__tabs .chip')) { await tab.click(); await check(p, size, 'room', i++); }
  });
  await run('pin-gate', AFTERNOON, {}, async (p) => { await tabTo(p, '家长'); await check(p, size, 'pin-gate', 0); });
  // Lessons, one activity at a time
  const only = (k: 'flashcards' | 'writing' | 'components' | 'speaking') => ({ flashcards: k === 'flashcards', writing: k === 'writing', components: k === 'components', speaking: k === 'speaking' });
  await run('flashcards', AFTERNOON, { activities: only('flashcards') }, async (p) => { await startLesson(p); await walkLesson(p, size, 'flashcards'); });
  await run('flashcards-evening', EVENING, { activities: only('flashcards') }, async (p) => { await startLesson(p); await walkLesson(p, size, 'flashcards-evening'); });
  await run('writing', AFTERNOON, { activities: only('writing') }, async (p) => { await startLesson(p); await walkLesson(p, size, 'writing', { firstOnly: true }); });
  await run('components', AFTERNOON, { activities: only('components') }, async (p) => { await startLesson(p); await walkLesson(p, size, 'components'); });
  await run('langdu', AFTERNOON, { activities: only('speaking'), speakingLast: 'story' }, async (p) => { await startLesson(p); await walkLesson(p, size, 'langdu'); });
  await run('langdu-extra', AFTERNOON, { doneToday: true }, async (p) => { await p.click('.langdu-btn'); await walkLesson(p, size, 'langdu-extra'); });
}

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
  try {
    for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 250)); }
    let browser: Browser;
    try { browser = await webkit.launch(); } catch (e) { console.error(`WebKit is missing: run  npx playwright-core install webkit  (ask first: it downloads ~100 MB)\n${e}`); process.exit(2); }
    await Promise.all(SIZES.map((size) => sweep(browser, size))); // sizes in parallel, each in its own contexts
    // A phone turned sideways: the overlay covers the screen
    const side = { name: 'iphone-sideways', width: 667, height: 375 };
    const page = await open(browser, side, AFTERNOON, {});
    const covered = await page.evaluate(() => { const h = document.querySelector('.rotate-hint'); if (!h) return false; const r = h.getBoundingClientRect(); return getComputedStyle(h).display !== 'none' && r.width >= innerWidth && r.height >= innerHeight; });
    mkdirSync(`${OUT}/${side.name}`, { recursive: true });
    await page.screenshot({ path: `${OUT}/${side.name}/home-00.png` });
    results.push({ size: side.name, flow: 'rotate', step: 0, sig: '', problems: covered ? [] : ['the turn-it-upright overlay does not cover the screen'] });
    await browser.close();
  } finally {
    server.kill();
  }
  const bad = results.filter((r) => r.problems.length);
  const lines = results.map((r) => `${r.problems.length ? 'FAIL' : 'ok  '} ${r.size.padEnd(18)} ${r.flow}-${String(r.step).padStart(2, '0')}  ${r.sig}${r.problems.length ? `\n       - ${r.problems.join('\n       - ')}` : ''}`);
  writeFileSync(`${OUT}/report.txt`, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  console.log(`\n${results.length} screens checked, ${bad.length} with problems. Screenshots: ${OUT}/`);
  process.exit(bad.length ? 1 : 0);
}

void main();
