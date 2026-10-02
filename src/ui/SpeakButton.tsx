import { speak } from '../audio/speech';

export function SpeakButton({ text, big = false }: { text: string; big?: boolean }) {
  return (
    <button type="button" class={`speak ${big ? 'speak--big' : ''}`} aria-label="听" onClick={() => speak(text)}>
      🔊
    </button>
  );
}
