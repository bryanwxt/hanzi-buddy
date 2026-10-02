import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { createSessionRecord } from '../session/runner';
import { getKid, saveKid } from '../store/repo';
import { makeAppData, renderWithApp } from '../test/renderWithApp';
import { DEFAULT_KID, type SessionPlan, type StepKind } from '../types';
import { Celebration } from './Celebration';

vi.mock('../audio/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../ui/confetti', () => ({ celebrate: vi.fn() }));
vi.mock('../ui/motion', () => ({ burst: vi.fn(), flyAlong: vi.fn(async () => {}), reducedMotion: () => true }));

const plan = (steps: StepKind[]): SessionPlan => ({ steps, reviewWordIds: [], newWordIds: [], flashTimeBoxMs: 0, writeCandidates: [], writeCount: 0 });
const finished = (date: string, steps: StepKind[]) => ({ ...createSessionRecord(plan(steps), date, 0), completed: true, completedSteps: steps });

async function setup(date: string, steps: StepKind[]) {
  const app = await makeAppData();
  await saveKid(app.db, { ...DEFAULT_KID });
  renderWithApp(<Celebration rec={finished(date, steps)} />, app);
  await screen.findByText('太棒了！');
  return app;
}

describe('Celebration chest', () => {
  it('gives one prize however fast the chest is tapped', async () => {
    const app = await setup('2026-10-02', ['flashcards']);
    fireEvent.click(screen.getByText('继续'));
    const chest = await screen.findByRole('button', { name: '打开宝箱' });
    fireEvent.click(chest);
    fireEvent.click(chest);
    fireEvent.click(chest);
    await screen.findByText(/有新东西了/);
    await waitFor(async () => expect((await getKid(app.db))?.lastChestDate).toBe('2026-10-02'));
    const kid = await getKid(app.db);
    expect(kid?.ownedAccessories).toHaveLength(1);
    expect(kid?.bonusStars).toBe(0);
  });

  it("dates the chest by the session's own day when it finishes after midnight", async () => {
    const app = await setup('2026-10-01', ['flashcards']);
    fireEvent.click(screen.getByText('继续'));
    fireEvent.click(await screen.findByRole('button', { name: '打开宝箱' }));
    await waitFor(async () => expect((await getKid(app.db))?.lastChestDate).toBe('2026-10-01'));
  });

  it('gives no chest for a session with no activities in it', async () => {
    await setup('2026-10-02', []);
    expect(screen.getByText('回家')).toBeTruthy();
  });
});
