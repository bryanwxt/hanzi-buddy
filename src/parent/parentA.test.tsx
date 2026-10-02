import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { hashPin } from '../lib/hash';
import { createSessionRecord } from '../session/runner';
import { getSettings, listRewards, putCards, putWords, saveSession } from '../store/repo';
import { makeCard, makeWord } from '../test/fixtures';
import { makeAppData, renderWithApp } from '../test/renderWithApp';
import { DEFAULT_SETTINGS, type SessionPlan } from '../types';
import { Dashboard } from './Dashboard';
import { PinGate } from './PinGate';
import { RewardsPanel } from './RewardsPanel';

const emptyPlan: SessionPlan = { steps: [], reviewWordIds: [], newWordIds: [], flashTimeBoxMs: 0, writeCandidates: [], writeCount: 0 };
const type = (pin: string) => [...pin].forEach((d) => fireEvent.click(screen.getByRole('button', { name: d })));

describe('PinGate', () => {
  it('unlocks with the right PIN only', async () => {
    const app = await makeAppData({ settings: { ...DEFAULT_SETTINGS, pinHash: await hashPin('2468') } });
    renderWithApp(<PinGate><p>secret</p></PinGate>, app);
    type('1111');
    expect(await screen.findByText('That PIN is not right. Try again.')).toBeTruthy();
    type('2468');
    expect(await screen.findByText('secret')).toBeTruthy();
  });

  it('lets a grown-up reset a forgotten PIN', async () => {
    const app = await makeAppData({ settings: { ...DEFAULT_SETTINGS, pinHash: await hashPin('2468') } });
    renderWithApp(<PinGate><p>secret</p></PinGate>, app);
    fireEvent.click(screen.getByText('Forgot PIN?'));
    const [, a, b] = document.body.textContent!.match(/(\d+) × (\d+)/)!;
    fireEvent.input(screen.getByLabelText('Answer'), { target: { value: String(Number(a) * Number(b)) } });
    fireEvent.click(screen.getByText('Check'));
    await screen.findByText('For parents: choose a 4-digit PIN');
    type('1357');
    await screen.findByText('Enter the same PIN again');
    type('1357');
    expect(await screen.findByText('secret')).toBeTruthy();
    expect((await getSettings(app.db)).pinHash).toBe(await hashPin('1357'));
  });
});

describe('Dashboard', () => {
  it('summarises progress and flags a missing voice and backup', async () => {
    const app = await makeAppData();
    await putWords(app.db, [makeWord('大')]);
    await putCards(app.db, [makeCard('b:大', 'recognise', new Date(2026, 9, 20), true)]);
    await saveSession(app.db, { ...createSessionRecord(emptyPlan, '2026-10-01', 0), completed: true, activeMs: 15 * 60_000 });
    renderWithApp(<Dashboard onNavigate={vi.fn()} />, app);
    expect(await screen.findByText('1 / 500')).toBeTruthy();
    expect(screen.getByText('No Chinese voice found.')).toBeTruthy();
    expect(screen.getByText(/Last backup: never/)).toBeTruthy();
    expect(screen.getByRole('img', { name: '2026-10-01: 15 minutes' })).toBeTruthy();
  });
});

describe('RewardsPanel', () => {
  it('adds a goal and marks it given once reached', async () => {
    const app = await makeAppData();
    await saveSession(app.db, { ...createSessionRecord(emptyPlan, '2026-10-01', 0), completed: true, completedSteps: ['flashcards'] });
    renderWithApp(<RewardsPanel />, app);
    fireEvent.input(await screen.findByLabelText('Reward'), { target: { value: 'Ice cream' } });
    fireEvent.input(screen.getByLabelText('Target'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Add goal'));
    fireEvent.click(await screen.findByText('Mark as given'));
    await waitFor(async () => expect((await listRewards(app.db))[0]!.claimedAt).not.toBeNull());
  });
});

describe('RewardsPanel emoji picker', () => {
  it('marks the chosen emoji as pressed', async () => {
    const app = await makeAppData();
    renderWithApp(<RewardsPanel />, app);
    const first = (await screen.findAllByRole('button', { pressed: true }))[0]!;
    expect(first.className).toContain('swatch');
  });
});
