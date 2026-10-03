import { average, rmsLevel } from '../langdu/loudness';

export const MAX_RECORDING_MS = 60_000;

export class MicDeniedError extends Error {}

export interface FinishedRecording {
  blob: Blob;
  mime: string;
  durationSec: number;
  level?: number; // average loudness while recording, when levels were measured
}

export interface ActiveRecording {
  stop(): Promise<FinishedRecording>;
  cancel(): void;
}

export function pickMime(): string {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder) return '';
  return ['audio/mp4', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
}

export function recordingSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && !!MediaRecorder && !!navigator.mediaDevices?.getUserMedia;
}

/** Reads the microphone level (RMS) every 100 ms from the same stream; null when Web Audio is unavailable. */
function startLevels(stream: MediaStream, onLevel: (level: number) => void): { stop(): void; levels: number[] } | null {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    const levels: number[] = [];
    const tick = setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      const l = rmsLevel(buf);
      levels.push(l);
      onLevel(l);
    }, 100);
    return {
      levels,
      stop: () => {
        clearInterval(tick);
        void ctx.close().catch(() => {});
      },
    };
  } catch {
    return null; // never block a recording on the meter
  }
}

export async function startRecording(onAutoStop: () => void, onLevel?: (level: number) => void): Promise<ActiveRecording> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) throw new MicDeniedError();
    throw e;
  }
  const mime = pickMime();
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const started = Date.now();
  const timer = setTimeout(onAutoStop, MAX_RECORDING_MS);
  const meter = onLevel ? startLevels(stream, onLevel) : null;
  const release = () => {
    clearTimeout(timer);
    meter?.stop();
    stream.getTracks().forEach((t) => t.stop());
  };
  recorder.start();
  return {
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          release();
          const type = recorder.mimeType || mime || 'audio/mp4';
          const level = meter?.levels.length ? average(meter.levels) : undefined;
          resolve({ blob: new Blob(chunks, { type }), mime: type, durationSec: Math.round((Date.now() - started) / 1000), ...(level === undefined ? {} : { level }) });
        };
        recorder.stop();
      }),
    cancel: () => {
      recorder.onstop = release;
      if (recorder.state !== 'inactive') recorder.stop();
      else release();
    },
  };
}
