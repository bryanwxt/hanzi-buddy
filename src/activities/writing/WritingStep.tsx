import HanziWriter from 'hanzi-writer';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { playSfx } from '../../audio/sfx';
import { speak } from '../../audio/speech';
import { hanChars } from '../../content';
import { loadStrokeData } from '../../content/strokes';
import type { KidState, Word } from '../../types';
import { BottomBar } from '../../ui/BottomBar';
import { burst } from '../../ui/motion';
import { isHardWrite } from '../../fun/mood';
import { Pet } from '../../ui/Pet';
import type { TruffleMood } from '../../ui/truffle/Truffle';
import { Label } from '../../ui/Label';
import { SpeakButton } from '../../ui/SpeakButton';
import { writingCue } from './cue';

export interface WriteResult {
  totalMisses: number;
  elapsedMs: number;
}

interface Props {
  word: Word;
  kid: KidState;
  resting: TruffleMood;
  isNew: boolean;
  onDone: (result: WriteResult | null) => void;
}

export function WritingStep({ word, kid, resting, isNew, onDone }: Props) {
  const chars = useMemo(() => hanChars(word.text), [word.id]);
  const cue = useMemo(() => writingCue(word), [word.id]);
  const [index, setIndex] = useState(0);
  const [misses, setMisses] = useState(0);
  const [charMisses, setCharMisses] = useState<number | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const startedAt = useRef(performance.now());

  useEffect(() => {
    speak(cue.speech);
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
  return (
    <>
      <div class="write">
        <div class="row write__head">
          <Pet
            kid={kid}
            size={130}
            mood={charMisses === null ? resting : charMisses > 3 ? 'neutral' : last && isHardWrite(isNew, misses) ? 'wow' : 'pleased'}
            bubble={charMisses === null ? '写一写！' : null}
          />
          <div class="write__cue">
            <div class="write__prompt">
              <span class="pinyin">{word.pinyin}</span>
              <SpeakButton text={cue.speech} />
            </div>
            {cue.blanked && <div class="write__blank"><Label zh={cue.blanked} py={cue.blankedPy ?? undefined} /></div>}
            {cue.meaning && <div class="write__meaning" lang="en">{cue.meaning}</div>}
          </div>
        </div>
        <div class="dots">
          {chars.map((c, i) => (
            <span key={`${c}${i}`} class={`dot ${i < index || (i === index && charMisses !== null) ? 'is-done' : ''}`} />
          ))}
        </div>
        <div ref={host} class="tianzige" />
      </div>
      {charMisses === null ? (
        <BottomBar actionLabel={last ? '完成' : '下一个字'} disabled onAction={() => {}} />
      ) : (
        <BottomBar tone="good" title={charMisses === 0 ? '完美！' : '写得好！'} actionLabel={last ? '完成' : '下一个字'} onAction={next} />
      )}
    </>
  );
}
