import { act, fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { BUILTIN, builtinWords } from '../content';
import { stickerFamilies } from '../fun/stickers';
import { createSessionRecord } from '../session/runner';
import { getKid, putCards, putWords, saveKid, saveReward, saveSession } from '../store/repo';
import { makeCard } from '../test/fixtures';
import { makeAppData, renderWithApp } from '../test/renderWithApp';
import { DEFAULT_KID, type SessionPlan } from '../types';
import { HomeScreen } from './HomeScreen';
import { StickerBook } from './StickerBook';
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
    fireEvent.click(screen.getByRole('button', { name: '开始：喂小龙' }));
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

describe('StickerBook', () => {
  it('shows family progress and opens a family page', async () => {
    const app = await makeAppData();
    await putWords(app.db, builtinWords(0));
    const water = stickerFamilies(BUILTIN).find((f) => f.component === '氵')!;
    await putCards(app.db, [makeCard(`b:${water.chars[0]}`, 'recognise', new Date(2026, 9, 20), true)]);
    renderWithApp(<StickerBook />, app);
    fireEvent.click(await screen.findByRole('button', { name: `氵 1/${water.chars.length}` }));
    expect(screen.getByRole('button', { name: water.chars[0] })).toBeTruthy();
    expect(document.querySelectorAll('.sticker--unknown')).toHaveLength(water.chars.length - 1);
  });
});

describe('StickerBook badge shelf', () => {
  it('keeps a badge the child already earned even after a card lapses', async () => {
    const app = await makeAppData({ kid: { ...DEFAULT_KID, badgesSeen: ['氵'] } });
    renderWithApp(<StickerBook />, app);
    expect(await screen.findByText('🏅 氵')).toBeTruthy();
  });
});

describe('HomeScreen dragon', () => {
  it('dozes off when left alone and wakes on a tap', async () => {
    const app = await makeAppData();
    renderWithApp(<HomeScreen sleepAfterMs={150} />, app);
    await screen.findByText('今天的练习');
    const dragon = () => document.querySelector('svg.dragon')!.getAttribute('class') ?? '';
    await waitFor(() => expect(dragon()).toContain('dragon--sleepy'));
    act(() => { window.dispatchEvent(new Event('pointerdown')); });
    await waitFor(() => expect(dragon()).toContain('dragon--happy'));
  });
});
