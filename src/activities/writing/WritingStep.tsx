import HanziWriter from 'hanzi-writer';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { playSfx } from '../../audio/sfx';
import { speak } from '../../audio/speech';
import { hanChars } from '../../content';
import { loadStrokeData } from '../../content/strokes';
import type { KidState, Word } from '../../types';
import { Label } from '../../ui/Label';
import { burst } from '../../ui/motion';
import { Pet } from '../../ui/Pet';
import { SpeakButton } from '../../ui/SpeakButton';

export interface WriteResult {
  totalMisses: number;
  elapsedMs: number;
}

interface Props {
  word: Word;
  kid: KidState;
  known: number;
  onDone: (result: WriteResult | null) => void;
}

export function WritingStep({ word, kid, known, onDone }: Props) {
  const chars = useMemo(() => hanChars(word.text), [word.id]);
  const [index, setIndex] = useState(0);
  const [misses, setMisses] = useState(0);
  const [charMisses, setCharMisses] = useState<number | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const startedAt = useRef(performance.now());

  useEffect(() => {
    speak(word.text);
  }, [word.id]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = '';
    setCharMisses(null);
    let cancelled = false;
    const size = Math.min(320, window.innerWidth - 64);
    const writer = HanziWriter.create(el, chars[index]!, {
      width: size,
      height: size,
      padding: 16,
      showCharacter: false,
      showOutline: false,
      showHintAfterMisses: 2,
      highlightOnComplete: true,
      drawingWidth: 24,
      strokeColor: '#2d3436',
      charDataLoader: (ch, onLoad, onError) => {
        loadStrokeData(ch).then((data) => onLoad(data as never), onError);
      },
      onLoadCharDataError: () => {
        if (!cancelled) onDone(null);
      },
    });
    void writer.quiz({
      onComplete: (summary) => {
        if (cancelled) return;
        playSfx('star');
        const r = host.current?.getBoundingClientRect();
        if (r) burst(r.left + r.width / 2, r.top + r.height / 2, { count: summary.totalMistakes === 0 ? 14 : 8 });
        setMisses((m) => m + summary.totalMistakes);
        setCharMisses(summary.totalMistakes);
      },
    });
    return () => {
      cancelled = true;
      writer.cancelQuiz();
    };
  }, [word.id, index]);

  const last = index === chars.length - 1;
  const next = () => {
    if (!last) setIndex(index + 1);
    else onDone({ totalMisses: misses, elapsedMs: Math.round(performance.now() - startedAt.current) });
  };
  const bubble = charMisses === null ? '写一写！' : charMisses === 0 ? '完美！' : '写得好！';

  return (
    <div class="write">
      <div class="row">
        <Pet kid={kid} known={known} size={80} mood={charMisses === null ? null : 'happy'} bubble={bubble} />
        <div class="write__prompt">
          <span class="pinyin">{word.pinyin}</span>
          <SpeakButton text={word.text} />
        </div>
      </div>
      <div class="dots">
        {chars.map((c, i) => (
          <span key={`${c}${i}`} class={`dot ${i < index || (i === index && charMisses !== null) ? 'is-done' : ''}`} />
        ))}
      </div>
      <div ref={host} class="tianzige" />
      {charMisses !== null && (
        <>
          <p class="praise">{charMisses === 0 ? '⭐ 完美 ⭐' : '⭐'}</p>
          <button type="button" class="btn btn--primary" onClick={next}>
            <Label zh={last ? '完成' : '下一个字'} />
          </button>
        </>
      )}
    </div>
  );
}
