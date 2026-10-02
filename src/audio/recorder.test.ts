import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickMime, recordingSupported } from './recorder';

describe('recorder support', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('prefers mp4 audio, falling back to webm', () => {
    vi.stubGlobal('MediaRecorder', { isTypeSupported: (m: string) => m === 'audio/webm' });
    expect(pickMime()).toBe('audio/webm');
    vi.stubGlobal('MediaRecorder', { isTypeSupported: () => true });
    expect(pickMime()).toBe('audio/mp4');
  });
  it('reports no support without MediaRecorder', () => {
    vi.stubGlobal('MediaRecorder', undefined);
    expect(pickMime()).toBe('');
    expect(recordingSupported()).toBe(false);
  });
});
