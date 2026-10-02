import { act, fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { BUILTIN, builtinWords } from '../content';
import { createSessionRecord } from '../session/runner';
import { getKid, putCards, putWords, saveKid, saveReward, saveSession } from '../store/repo';
import { makeCard } from '../test/fixtures';
import { makeAppData, renderWithApp } from '../test/renderWithApp';
import { DEFAULT_KID, type SessionPlan } from '../types';
import { HomeScreen } from './HomeScreen';
import { CollectionScreen } from './CollectionScreen';
import { powerFamilies } from '../fun/powers';
import { Wardrobe } from './Wardrobe';

vi.mock('../audio/speech', () => ({ speak: vi.fn(), primeSpeech: vi.fn() }));
vi.mock('../ui/confetti', () => ({ celebrate: vi.fn() }));

const emptyPlan: SessionPlan = { steps: [], reviewWordIds: [], newWordIds: [], flashTimeBoxMs: 0, writeCandidates: [], writeCount: 0 };
const done = (date: string, steps: SessionPlan['steps']) => ({ ...createSessionRecord(emptyPlan, date, 0), completed: true, completedSteps: steps });

describe('HomeScreen', () => {
  it("shows streak and stars and starts today's path", async () => {
    const app = await makeAppData();
    await saveSession(app.db, done('2026-10-01', ['flashcards', 'writing']));
    renderWithApp(<HomeScreen />, app);
    expect(await screen.findByLabelText('连续 1 天')).toBeTruthy();
    expect(screen.getByLabelText('2 颗星')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '开始：认一认' }));
    expect(app.go).toHaveBeenCalledWith({ name: 'session', free: false });
  });

  it('offers free play once today is done and shows the next reward goal', async () => {
    const app = await makeAppData({ kid: { ...DEFAULT_KID, lastChestDate: '2026-10-02' } });
    await saveSession(app.db, done('2026-10-02', ['flashcards']));
    await putCards(app.db, [makeCard('b:大', 'recognise', new Date(2026, 9, 5))]);
    await saveReward(app.db, { id: 'g', title: 'Ice cream', emoji: '🍦', metric: 'stars', target: 10, createdAt: 0, claimedAt: null });
    renderWithApp(<HomeScreen />, app);
    expect(await screen.findByText('今天完成了！')).toBeTruthy();
    expect(screen.getByText('Ice cream')).toBeTruthy();
    expect(screen.getByText('1 / 10 ⭐')).toBeTruthy();
    fireEvent.click(screen.getByText('再玩一会儿'));
    expect(app.go).toHaveBeenCalledWith({ name: 'session', free: true });
  });

  it('reopens the session to claim an unopened chest', async () => {
    const app = await makeAppData();
    await saveSession(app.db, done('2026-10-02', ['flashcards']));
    renderWithApp(<HomeScreen />, app);
    fireEvent.click(await screen.findByRole('button', { name: '继续：宝箱' }));
    expect(app.go).toHaveBeenCalledWith({ name: 'session', free: false });
  });
});

describe('Wardrobe', () => {
  it('puts on an owned accessory', async () => {
    const kid = { ...DEFAULT_KID, ownedAccessories: ['🎩', '👑'] };
    const app = await makeAppData({ kid });
    await saveKid(app.db, kid);
    renderWithApp(<Wardrobe />, app);
    fireEvent.click(await screen.findByRole('button', { name: '👑' }));
    await waitFor(async () => expect((await getKid(app.db))?.wearing).toBe('👑'));
  });
});

describe('CollectionScreen', () => {
  it('counts caught cards and filters by power', async () => {
    const app = await makeAppData();
    await putWords(app.db, builtinWords(0));
    await putCards(app.db, [makeCard('b:河', 'recognise', new Date(2026, 9, 20), true)]);
    renderWithApp(<CollectionScreen />, app);
    expect(await screen.findByText(`1 / ${BUILTIN.length}`)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /水/ }));
    expect(screen.getByRole('button', { name: '河' })).toBeTruthy();
    expect(document.querySelectorAll('.zika:not(.card--back)')).toHaveLength(1);
  });
  it('puts the 金卡 filter right after 全部 so it is on screen', async () => {
    const app = await makeAppData();
    renderWithApp(<CollectionScreen />, app);
    await screen.findByText('全部');
    const chips = [...document.querySelectorAll('.filters button')].map((b) => b.textContent);
    expect(chips[1]).toContain('金卡');
  });
  it('keeps earned badges', async () => {
    const app = await makeAppData({ kid: { ...DEFAULT_KID, badgesSeen: ['氵'] } });
    renderWithApp(<CollectionScreen />, app);
    expect(await screen.findByText('🏅 氵')).toBeTruthy();
  });
});

describe('Wardrobe', () => {
  it('shows Truffle wearing what the child already earned (dragon-era data)', async () => {
    const app = await makeAppData({ kid: { ...DEFAULT_KID, ownedAccessories: ['👑'], wearing: '👑', lastStageSeen: 3 } });
    renderWithApp(<Wardrobe />, app);
    expect(document.querySelector('svg.truffle .truffle__accessory')?.textContent).toBe('👑');
  });
});

describe("Truffle's room powers", () => {
  it('choose a power the child has unlocked', async () => {
    const app = await makeAppData({ kid: { ...DEFAULT_KID, powerTiersSeen: { water: 1 } } });
    renderWithApp(<Wardrobe />, app);
    fireEvent.click(screen.getByRole('tab', { name: '能力' }));
    const rows = await screen.findAllByRole('button', { name: /\d+\/\d+/ });
    expect(rows).toHaveLength(11);
    const fire = rows.find((r) => r.getAttribute('aria-label')!.startsWith('火'))!;
    expect((fire as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(rows.find((r) => r.getAttribute('aria-label')!.startsWith('水'))!);
    await waitFor(async () => expect((await getKid(app.db))?.activePower).toBe('water'));
    expect(document.querySelector('svg.truffle')?.getAttribute('data-power')).toBe('water');
  });
});

describe("Truffle's room ready-to-unlock hint", () => {
  it('marks a power the child has earned but not yet unlocked at a celebration', async () => {
    const app = await makeAppData();
    const water = powerFamilies(BUILTIN).water.slice(0, 3);
    await putWords(app.db, builtinWords(0));
    await putCards(app.db, water.map((c) => makeCard(`b:${c}`, 'recognise', new Date(2026, 9, 20), true)));
    renderWithApp(<Wardrobe />, app);
    fireEvent.click(screen.getByRole('tab', { name: '能力' }));
    await waitFor(() => expect(document.querySelectorAll('.power-row__ready')).toHaveLength(1));
    expect(screen.getByText('完成练习就解锁')).toBeTruthy();
  });
});

describe("Truffle's room outfits", () => {
  it('wear a onesie, take it off; locked ones are disabled', async () => {
    const app = await makeAppData({ kid: { ...DEFAULT_KID, ownedCostumes: ['tiger'], ownedAccessories: ['👑'], wearing: '👑' } });
    renderWithApp(<Wardrobe />, app);
    fireEvent.click(screen.getByRole('button', { name: '虎' }));
    await waitFor(async () => expect((await getKid(app.db))?.outfit).toBe('tiger'));
    expect(document.querySelector('svg.truffle')?.getAttribute('data-outfit')).toBe('tiger');
    expect(document.querySelector('.truffle__accessory')).toBeNull();
    expect(screen.getByText('穿着连体衣时看不到小东西')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '虎' }));
    await waitFor(async () => expect((await getKid(app.db))?.outfit).toBeNull());
    expect((screen.getByRole('button', { name: '龙' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('HomeScreen word of the day', () => {
  it('shows a known character as the word of the day', async () => {
    const app = await makeAppData();
    await putWords(app.db, builtinWords(0));
    await putCards(app.db, [makeCard('b:大', 'recognise', new Date(2026, 9, 20), true)]);
    renderWithApp(<HomeScreen />, app);
    expect(await screen.findByRole('button', { name: '今日一字：大' })).toBeTruthy();
  });
});

describe('HomeScreen Truffle', () => {
  it('shows Truffle sulking before practice, named 松露', async () => {
    const app = await makeAppData();
    renderWithApp(<HomeScreen />, app);
    await screen.findByText('今天的练习');
    expect(document.querySelector('svg.truffle')?.getAttribute('data-mood')).toBe('sulk');
    expect(document.querySelector('.home__who')?.textContent).toContain('松露');
  });
  it('dozes off when left alone and wakes on a tap', async () => {
    const app = await makeAppData();
    renderWithApp(<HomeScreen sleepAfterMs={150} />, app);
    await screen.findByText('今天的练习');
    const mood = () => document.querySelector('svg.truffle')!.getAttribute('data-mood');
    await waitFor(() => expect(mood()).toBe('sleepy'));
    act(() => { window.dispatchEvent(new Event('pointerdown')); });
    await waitFor(() => expect(mood()).toBe('sulk'));
  });
});
