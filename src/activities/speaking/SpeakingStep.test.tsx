import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { SpeakingStep } from './SpeakingStep';

vi.mock('../../audio/recorder', () => ({
  MicDeniedError: class MicDeniedError extends Error {},
  recordingSupported: () => true,
  startRecording: vi.fn(),
}));
vi.mock('../../audio/speech', () => ({ speak: vi.fn() }));
vi.mock('../../audio/sfx', () => ({ playSfx: vi.fn() }));

import { MicDeniedError, startRecording } from '../../audio/recorder';

const choice = { kind: 'passage' as const, passage: { id: 'p01', title: '我的家', text: '我家有五个人。' } };

describe('SpeakingStep', () => {
  it('records, lets the child listen back, and saves', async () => {
    vi.mocked(startRecording).mockResolvedValue({
      stop: async () => ({ blob: new Blob(['x']), mime: 'audio/mp4', durationSec: 3 }),
      cancel: vi.fn(),
    });
    const onSave = vi.fn(async () => {});
    render(<SpeakingStep choice={choice} onSave={onSave} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByText('开始录音'));
    fireEvent.click(await screen.findByText('停止'));
    fireEvent.click(await screen.findByText('保存'));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ mime: 'audio/mp4', durationSec: 3 })));
  });

  it('lets the child carry on when the microphone is blocked', async () => {
    vi.mocked(startRecording).mockRejectedValue(new MicDeniedError());
    const onSkip = vi.fn();
    render(<SpeakingStep choice={choice} onSave={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByText('开始录音'));
    fireEvent.click(await screen.findByText('继续'));
    expect(onSkip).toHaveBeenCalled();
  });
});
