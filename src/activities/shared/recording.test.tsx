import { fireEvent, render, screen } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BLOCKED_NOTE, MicButton, useRecorder } from './recording';

vi.mock('../../audio/recorder', () => ({ recordingSupported: vi.fn(() => true), startRecording: vi.fn() }));
import { recordingSupported, startRecording } from '../../audio/recorder';

function Harness() {
  const rec = useRecorder();
  return (
    <div>
      <MicButton rec={rec} withLevel={false} />
      <span data-testid="state">{rec.state}</span>
    </div>
  );
}

beforeEach(() => {
  vi.mocked(recordingSupported).mockReturnValue(true);
  vi.mocked(startRecording).mockReset();
  vi.mocked(startRecording).mockResolvedValue({ stop: async () => ({ blob: new Blob(['x']), mime: 'audio/mp4', durationSec: 2 }), cancel: vi.fn() });
});

describe('shared recorder', () => {
  it('one tap records; 停止 finishes', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('开始录音'));
    fireEvent.click(await screen.findByText('停止'));
    await screen.findByText('done');
    expect(startRecording).toHaveBeenCalledTimes(1);
  });
  it('a double tap while the mic opens starts one recording', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('开始录音'));
    fireEvent.click(screen.queryByText('开始录音') ?? document.body);
    await screen.findByText('停止');
    expect(startRecording).toHaveBeenCalledTimes(1);
  });
  it('no microphone: the blocked note', () => {
    vi.mocked(recordingSupported).mockReturnValue(false);
    render(<Harness />);
    expect(screen.getByText(BLOCKED_NOTE)).toBeTruthy();
  });
});
