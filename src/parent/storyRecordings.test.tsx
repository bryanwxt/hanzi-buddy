import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORY_PARTS } from '../kantu/scenes';
import { addRecording, listRecordings } from '../store/repo';
import { makeAppData, renderWithApp } from '../test/renderWithApp';
import type { Recording } from '../types';
import { groupRecordings, RecordingsPanel } from './RecordingsPanel';

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});

const base = new Date(2026, 9, 6, 17).getTime();
const r = (id: string, createdAt: number, prompt: Recording['prompt']): Recording => ({ id, createdAt, prompt, blob: new Blob(['x']), mime: 'audio/mp4', durationSec: 5 });
const story = (sceneId: string, t: number): Recording[] => [
  ...STORY_PARTS.map((p, i) => r(`${sceneId}-${p.part}-${t}`, t + i, { kind: 'story', sceneId, part: p.part })),
  r(`${sceneId}-whole-${t}`, t + 5, { kind: 'story', sceneId, part: 'whole' }),
  r(`${sceneId}-q0-${t}`, t + 6, { kind: 'answer', sceneId, question: 0 }),
  r(`${sceneId}-q1-${t}`, t + 7, { kind: 'answer', sceneId, question: 1 }),
];

describe('groupRecordings', () => {
  it('groups one telling of a scene; a passage stays single; two days of the same scene stay apart', () => {
    const recs = [...story('vase', base), r('p', base + 60_000, { kind: 'passage', passageId: 'p01' }), ...story('vase', base + 86_400_000)].sort((a, b) => b.createdAt - a.createdAt);
    const g = groupRecordings(recs);
    expect(g.map((x) => (x.kind === 'story' ? `story:${x.recs.length}` : 'single'))).toEqual(['story:8', 'single', 'story:8']);
  });
});

describe('RecordingsPanel stories', () => {
  it('shows a story as one row with its parts, and deletes it as one', async () => {
    const app = await makeAppData();
    for (const x of [...story('vase', base), r('p', base + 60_000, { kind: 'passage', passageId: 'p01' })]) await addRecording(app.db, x);
    renderWithApp(<RecordingsPanel />, app);
    expect(await screen.findByText('🖼️ 打翻花瓶')).toBeTruthy();
    expect(document.querySelectorAll('tr.rec-row')).toHaveLength(2);
    fireEvent.click(screen.getByText('Show parts'));
    expect(document.querySelectorAll('.story-parts audio')).toHaveLength(8);
    expect(screen.getByText('开场白')).toBeTruthy();
    expect(screen.getByText('讲一讲 (whole story)')).toBeTruthy();
    vi.stubGlobal('confirm', () => true);
    const storyRow = screen.getByText('🖼️ 打翻花瓶').closest('tr')!;
    fireEvent.click([...storyRow.querySelectorAll('button')].find((b) => b.textContent === 'Delete')!);
    await waitFor(async () => expect((await listRecordings(app.db)).map((x) => x.id)).toEqual(['p']));
    vi.unstubAllGlobals();
  });
});
