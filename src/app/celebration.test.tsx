import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { createSessionRecord } from '../session/runner';
import { BUILTIN, builtinWords } from '../content';
import { powerFamilies } from '../fun/powers';
import { getKid, putCards, putWords, saveKid } from '../store/repo';
import { makeCard } from '../test/fixtures';
import { makeAppData, renderWithApp } from '../test/renderWithApp';
import { DEFAULT_KID, type SessionPlan, type StepKind } from '../types';
import { Celebration } from './Celebration';

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../ui/confetti', () => ({ celebrate: vi.fn() }));
vi.mock('../ui/motion', () => ({ burst: vi.fn(), flyAlong: vi.fn(async () => {}), reducedMotion: () => true }));

const plan = (steps: StepKind[]): SessionPlan => ({ steps, reviewWordIds: [], newWordIds: [], flashTimeBoxMs: 0, writeCandidates: [], writeCount: 0 });
const finished = (date: string, steps: StepKind[]) => ({ ...createSessionRecord(plan(steps), date, 0), completed: true, completedSteps: steps });

const hold = () => new Promise((r) => setTimeout(r, 1300));

async function setup(date: string, steps: StepKind[]) {
  const app = await makeAppData();
  await saveKid(app.db, { ...DEFAULT_KID, petName: '小龙' }); // a dragon-era install
  renderWithApp(<Celebration rec={finished(date, steps)} />, app);
  await screen.findByText('太棒了！');
  return app;
}

describe('Celebration chest', () => {
  it('gives one prize however fast the chest is tapped', async () => {
    const app = await setup('2026-10-02', ['flashcards']);
    fireEvent.click(screen.getByText('继续'));
    const chest = await screen.findByRole('button', { name: '按住打开宝箱' });
    for (let i = 0; i < 3; i++) fireEvent(chest, new Event('pointerdown', { bubbles: true }));
    await hold();
    await screen.findByText('松露有新东西了！');
    await waitFor(async () => expect((await getKid(app.db))?.lastChestDate).toBe('2026-10-02'));
    const kid = await getKid(app.db);
    expect(kid?.ownedAccessories).toHaveLength(1);
    expect(kid?.bonusStars).toBe(0);
  });

  it("dates the chest by the session's own day when it finishes after midnight", async () => {
    const app = await setup('2026-10-01', ['flashcards']);
    fireEvent.click(screen.getByText('继续'));
    fireEvent(await screen.findByRole('button', { name: '按住打开宝箱' }), new Event('pointerdown', { bubbles: true }));
    await hold();
    await waitFor(async () => expect((await getKid(app.db))?.lastChestDate).toBe('2026-10-01'));
  });

  it('gives no chest for a session with no activities in it', async () => {
    await setup('2026-10-02', []);
    expect(screen.getByText('回家')).toBeTruthy();
  });
});

describe('Celebration power-up', () => {
  it('powers Truffle up when a tier is newly reached, and remembers it', async () => {
    const app = await makeAppData();
    const water = powerFamilies(BUILTIN).water.slice(0, 3);
    await putWords(app.db, builtinWords(0));
    await putCards(app.db, water.map((c) => makeCard(`b:${c}`, 'recognise', new Date(2026, 9, 20), true)));
    await saveKid(app.db, { ...DEFAULT_KID, lastChestDate: '2026-10-02' });
    renderWithApp(<Celebration rec={finished('2026-10-02', ['flashcards'])} />, app);
    await screen.findByText('太棒了！');
    fireEvent.click(screen.getByText('继续'));
    expect(await screen.findByText('新能力！')).toBeTruthy();
    expect(screen.getByText('按住，变身！')).toBeTruthy();
    expect(document.querySelector('svg.truffle')?.getAttribute('data-tier')).toBe('0');
    fireEvent(screen.getByRole('button', { name: '按住，变身！' }), new Event('pointerdown', { bubbles: true }));
    await hold();
    await waitFor(async () => expect((await getKid(app.db))?.powerTiersSeen.water).toBe(1));
    expect((await getKid(app.db))?.activePower).toBe('water');
    await waitFor(() => expect(document.querySelector('svg.truffle')?.getAttribute('data-power')).toBe('water'));
  });
});
