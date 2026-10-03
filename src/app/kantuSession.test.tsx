import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { SCENES_KT, STORY_PARTS } from '../kantu/scenes';
import { getKid, listRecordings, saveKid, saveParentPassage, updateSettings } from '../store/repo';
import { makeAppData, renderWithApp } from '../test/renderWithApp';
import { DEFAULT_KID, DEFAULT_SETTINGS } from '../types';
import { SessionScreen } from './SessionScreen';

vi.mock('../audio/speech', () => ({ stopSpeaking: vi.fn(), speak: vi.fn(), primeSpeech: vi.fn() }));
vi.mock('../audio/sfx', () => ({ playSfx: vi.fn() }));
vi.mock('../ui/confetti', () => ({ celebrate: vi.fn() }));
vi.mock('../audio/recorder', () => ({
  recordingSupported: () => true,
  startRecording: vi.fn(async () => ({ stop: async () => ({ blob: new Blob(['x']), mime: 'audio/mp4', durationSec: 4 }), cancel: vi.fn() })),
}));

const speakingOnly = { ...DEFAULT_SETTINGS.activities, flashcards: false, writing: false, components: false, speaking: true };

async function setup(kid: Partial<typeof DEFAULT_KID>, withPassage = true) {
  const app = await makeAppData({ now: () => new Date(2026, 9, 6, 17) });
  await updateSettings(app.db, { activities: speakingOnly });
  if (withPassage) await saveParentPassage(app.db, { id: 'pp:1', title: '我家', text: '我爱爸爸，我爱妈妈。', createdAt: 1 });
  await saveKid(app.db, { ...DEFAULT_KID, ...kid });
  return app;
}

async function tellStory() {
  const vase = SCENES_KT[0]!;
  for (let i = 0; i < STORY_PARTS.length + 1 + vase.questions.length; i++) {
    fireEvent.click(await screen.findByText('开始录音'));
    fireEvent.click(await screen.findByText('停止'));
    await screen.findByText('听松露说');
    fireEvent.click(screen.getByText(i === STORY_PARTS.length + vase.questions.length ? '完成' : '继续'));
  }
}

describe('speaking step alternation', () => {
  it('a fresh profile gets the vase story; finishing it counts the story and saves every recording', async () => {
    const app = await setup({});
    renderWithApp(<SessionScreen free={false} />, app);
    expect(await screen.findByText('图上画的是什么？')).toBeTruthy();
    await tellStory();
    expect(await screen.findByText('太棒了！')).toBeTruthy();
    const kid = (await getKid(app.db))!;
    expect(kid.story).toEqual({ next: 1, told: 1 });
    expect(kid.speakingLast).toBe('story');
    expect(kid.reading.days).toBe(0); // a story day is not a 朗读 day
    const recs = await listRecordings(app.db);
    expect(recs).toHaveLength(8);
    expect(recs.filter((r) => r.prompt.kind === 'story')).toHaveLength(6);
    expect(recs.filter((r) => r.prompt.kind === 'answer')).toHaveLength(2);
  });

  it('after a story day, the next lesson is 朗读', async () => {
    const app = await setup({ speakingLast: 'story' });
    renderWithApp(<SessionScreen free={false} />, app);
    expect(await screen.findByText('老师好！')).toBeTruthy();
  });

  it('with nothing to read, the story runs even after a story day', async () => {
    const app = await setup({ speakingLast: 'story', story: { next: 1, told: 1 } }, false);
    renderWithApp(<SessionScreen free={false} />, app);
    expect(await screen.findByText('图上画的是什么？')).toBeTruthy();
    expect(screen.getByRole('img', { name: '捡到钱包' })).toBeTruthy();
  });
});
