import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickMime, recordingSupported, startRecording } from './recorder';

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

describe('recording levels', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
  it('reports the microphone level while recording and averages it on stop', async () => {
    vi.useFakeTimers();
    const track = { stop: vi.fn() };
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })) } });
    class FakeRecorder {
      static isTypeSupported = () => true;
      mimeType = 'audio/mp4'; state = 'recording';
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start() {}
      stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['x']) }); this.onstop?.(); }
    }
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    const close = vi.fn(async () => {});
    class FakeCtx {
      createMediaStreamSource() { return { connect: () => {} }; }
      createAnalyser() { return { fftSize: 4, getFloatTimeDomainData: (b: Float32Array) => b.forEach((_, i) => (b[i] = i % 2 ? -0.5 : 0.5)) }; }
      close = close;
    }
    vi.stubGlobal('AudioContext', FakeCtx);
    const levels: number[] = [];
    const rec = await startRecording(() => {}, (l) => levels.push(l));
    vi.advanceTimersByTime(350);
    expect(levels.length).toBe(3);
    expect(levels[0]).toBeCloseTo(0.5);
    const done = await rec.stop();
    expect(done.level).toBeCloseTo(0.5);
    expect(close).toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalled();
  });
});
