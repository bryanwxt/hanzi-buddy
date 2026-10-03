import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { getKid, listRecordings, saveKid, saveParentPassage } from '../store/repo';
import { makeAppData, renderWithApp } from '../test/renderWithApp';
import { DEFAULT_KID } from '../types';
import { HomeScreen } from './HomeScreen';
import { LangduScreen } from './LangduScreen';

vi.mock('../audio/speech', () => ({ speak: vi.fn(), primeSpeech: vi.fn() }));
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../ui/confetti', () => ({ celebrate: vi.fn() }));
vi.mock('../audio/recorder', () => ({
  recordingSupported: () => true,
  startRecording: vi.fn(async (_stop: () => void, onLevel?: (l: number) => void) => {
    onLevel?.(0.2);
    return { stop: async () => ({ blob: new Blob(['x']), mime: 'audio/mp4', durationSec: 3, ...(onLevel ? { level: 0.2 } : {}) }), cancel: vi.fn() };
  }),
}));

const kid = { ...DEFAULT_KID, reading: { passageId: 'pp:1', days: 1, extra: 0, lastDay: '2026-10-01', lastRead: { 'pp:1': '2026-10-01' }, warmups: 3 } };

describe('朗读 extra rounds', () => {
  it("Home's 多读一遍 button opens an extra round of today's passage; it saves the read but leaves the cycle and stars alone", async () => {
    const app = await makeAppData({ kid, now: () => new Date(2026, 9, 2, 17) });
    await saveParentPassage(app.db, { id: 'pp:1', title: '我家', text: '我爱爸爸，我爱妈妈。', createdAt: 1 });
    await saveKid(app.db, kid);
    const home = renderWithApp(<HomeScreen />, app);
    fireEvent.click(await screen.findByRole('button', { name: '多读一遍' }));
    expect(app.go).toHaveBeenCalledWith({ name: 'langdu' });
    home.unmount();

    renderWithApp(<LangduScreen />, app);
    expect(await screen.findByText('我爱爸爸，')).toBeTruthy(); // straight to echo: no warm-up
    expect(screen.queryByText('老师好！')).toBeNull();
    fireEvent.click(screen.getByText('下一句'));
    fireEvent.click(screen.getByText('开始朗读'));
    fireEvent.click(screen.getByText('开始录音'));
    fireEvent.click(await screen.findByText('停止'));
    await screen.findByText('听听你自己');
    fireEvent.click(screen.getByText('完成'));
    await waitFor(() => expect(app.go).toHaveBeenLastCalledWith({ name: 'home' }));
    const recs = await listRecordings(app.db);
    expect(recs).toHaveLength(1);
    expect(recs[0]!.prompt).toEqual({ kind: 'passage', passageId: 'pp:1' });
    const after = (await getKid(app.db))!;
    expect(after.reading.days).toBe(1);
    expect(after.bonusStars).toBe(0);
  });

  it('no 多读一遍 button when there is nothing to read', async () => {
    const app = await makeAppData();
    renderWithApp(<HomeScreen />, app);
    await screen.findByText('今天的练习');
    expect(screen.queryByRole('button', { name: '多读一遍' })).toBeNull();
  });
});

describe('the lesson path names the step 朗读', () => {
  it('shows 朗读 for the reading step', async () => {
    const app = await makeAppData();
    renderWithApp(<HomeScreen />, app);
    await screen.findByText('今天的练习');
    expect([...document.querySelectorAll('.path__name')].map((n) => n.querySelector('.sr-only')?.textContent ?? n.textContent)).toContain('朗读');
  });
});
