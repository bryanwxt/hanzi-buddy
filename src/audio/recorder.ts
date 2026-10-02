export const MAX_RECORDING_MS = 60_000;

export class MicDeniedError extends Error {}

export interface FinishedRecording {
  blob: Blob;
  mime: string;
  durationSec: number;
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

export async function startRecording(onAutoStop: () => void): Promise<ActiveRecording> {
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
  const release = () => {
    clearTimeout(timer);
    stream.getTracks().forEach((t) => t.stop());
  };
  recorder.start();
  return {
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          release();
          const type = recorder.mimeType || mime || 'audio/mp4';
          resolve({ blob: new Blob(chunks, { type }), mime: type, durationSec: Math.round((Date.now() - started) / 1000) });
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
