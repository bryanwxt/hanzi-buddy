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
  it("shows streak, stars and starts today's practice", async () => {
    const app = await makeAppData();
    await saveSession(app.db, done('2026-10-01', ['flashcards', 'writing']));
    renderWithApp(<HomeScreen />, app);
    expect(await screen.findByText('🔥 1')).toBeTruthy();
    expect(screen.getByText('⭐ 2')).toBeTruthy();
    fireEvent.click(screen.getByText('今天的练习'));
    expect(app.go).toHaveBeenCalledWith({ name: 'session', free: false });
  });

  it('offers free play once today is done and shows the next reward goal', async () => {
    const app = await makeAppData();
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
