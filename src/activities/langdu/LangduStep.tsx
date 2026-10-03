import { Mic, Volume2 } from 'lucide-preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { recordingSupported, startRecording, type ActiveRecording, type FinishedRecording } from '../../audio/recorder';
import { playSfx } from '../../audio/sfx';
import { speak } from '../../audio/speech';
import type { ReadingPassage } from '../../langdu/cycle';
import { introLines, pinyinMode } from '../../langdu/intro';
import { quietFor } from '../../langdu/loudness';
import { displayText, splitPhrases } from '../../langdu/phrases';
import type { KidState, OralInfo } from '../../types';
import { BottomBar } from '../../ui/BottomBar';
import { Label } from '../../ui/Label';
import { Pet } from '../../ui/Pet';
import { LoudnessMeter } from './LoudnessMeter';

export interface LangduResult {
  intro: FinishedRecording | null; // daily step only
  read: FinishedRecording | null; // null when the microphone was unavailable
}

interface Props {
  passage: ReadingPassage;
  oral: OralInfo;
  warmups: number;
  knownChars: Set<string>;
  kid: KidState;
  withWarmup: boolean;
  onDone: (r: LangduResult) => void;
}

type Part = 'warmup' | 'echo' | 'read' | 'listen';
type MicState = 'ready' | 'recording' | 'done' | 'blocked';

const BLOCKED_NOTE = '麦克风没有打开。我们下次再录！';
const HEARD = 0.002; // above a working microphone's noise floor; a suspended meter reads exactly 0

/** One recording at a time, with an optional live level; a refused or missing mic becomes 'blocked', never an error. */
function useRecorder() {
  const [state, setState] = useState<MicState>(recordingSupported() ? 'ready' : 'blocked');
  const [result, setResult] = useState<FinishedRecording | null>(null);
  const [level, setLevel] = useState(0);
  const [quietMs, setQuietMs] = useState(0);
  const [heard, setHeard] = useState(false); // a real level has arrived: until then no meter, so a silent meter never nags
  const active = useRef<ActiveRecording | null>(null);
  const starting = useRef(false); // the mic is opening: a second tap must not start a second recording
  const mounted = useRef(true);
  const series = useRef<{ at: number; level: number }[]>([]);
  useEffect(() => () => {
    mounted.current = false;
    active.current?.cancel();
  }, []);

  const stop = async () => {
    const rec = active.current;
    if (!rec) return;
    active.current = null;
    setResult(await rec.stop());
    setState('done');
  };
  const start = async (withLevel: boolean) => {
    if (starting.current || active.current) return;
    starting.current = true;
    series.current = [];
    try {
      const rec = await startRecording(
        () => void stop(),
        withLevel
          ? (l) => {
              const now = performance.now();
              series.current.push({ at: now, level: l });
              setLevel(l);
              setQuietMs(quietFor(series.current, now));
              if (l > HEARD) setHeard(true);
            }
          : undefined,
      );
      if (!mounted.current) return rec.cancel(); // he left while the mic was opening: never leave it on
      active.current = rec;
      setState('recording');
    } catch {
      if (mounted.current) setState('blocked');
    } finally {
      starting.current = false;
    }
  };
  const reset = () => {
    setResult(null);
    setLevel(0);
    setQuietMs(0);
    setHeard(false);
    setState((s) => (s === 'blocked' ? s : 'ready'));
  };
  return { state, result, level, quietMs, heard, start, stop, reset };
}

function MicButton({ rec, withLevel }: { rec: ReturnType<typeof useRecorder>; withLevel: boolean }) {
  if (rec.state === 'blocked') {
    return (
      <p class="warning">
        <Label zh={BLOCKED_NOTE} />
        <br />
        <small>Ask a parent to allow the microphone for this app.</small>
      </p>
    );
  }
  if (rec.state === 'recording') {
    return (
      <>
        {withLevel && rec.heard && <LoudnessMeter level={rec.level} quietMs={rec.quietMs} />}
        <button type="button" class="mic-btn is-recording" onClick={() => void rec.stop()}>
          <span class="rec-dot" />
          <Label zh="停止" />
        </button>
      </>
    );
  }
  if (rec.state === 'ready') {
    return (
      <button type="button" class="mic-btn" onClick={() => void rec.start(withLevel)}>
        <Mic size={52} strokeWidth={2.5} />
        <Label zh="开始录音" />
      </button>
    );
  }
  return null;
}

/** The 朗读 coach: etiquette warm-up → echo by phrase → read it all with the meter → listen back. */
export function LangduStep({ passage, oral, warmups, knownChars, kid, withWarmup, onDone }: Props) {
  const [part, setPart] = useState<Part>(withWarmup ? 'warmup' : 'echo');
  const [phrase, setPhrase] = useState(0);
  const intro = useRecorder();
  const read = useRecorder();
  const lines = useMemo(() => introLines(oral), [oral]);
  const phrases = useMemo(() => splitPhrases(passage.text), [passage.text]);
  const mode = pinyinMode(warmups);
  const pinyinFor = mode === 'full' ? undefined : mode === 'unknown' ? (ch: string) => !knownChars.has(ch) : () => false;
  const playbackUrl = useMemo(() => (read.result ? URL.createObjectURL(read.result.blob) : null), [read.result]);
  useEffect(() => () => { if (playbackUrl) URL.revokeObjectURL(playbackUrl); }, [playbackUrl]);

  useEffect(() => {
    if (part === 'warmup') speak('你好！');
    if (part === 'echo' && phrases[phrase]) speak(phrases[phrase]!);
    if (part === 'listen' && withWarmup) speak(lines.thanks);
  }, [part, phrase]);

  useEffect(() => {
    if (read.state === 'done' && part === 'read') {
      playSfx('star');
      setPart('listen');
    }
  }, [read.state]);

  const finish = () => onDone({ intro: intro.result, read: read.result });

  if (part === 'warmup') {
    return (
      <>
        <div class="langdu">
          <Pet kid={kid} mood="neutral" size={130} bubble="你好！" />
          <div class="langdu__script">
            <p class="langdu__line"><Label zh={lines.hello} pinyinFor={pinyinFor} /></p>
            {lines.body && <p class="langdu__line"><Label zh={lines.body} pinyinFor={pinyinFor} /></p>}
          </div>
          <MicButton rec={intro} withLevel={false} />
          {intro.state === 'done' && <p class="langdu__ok"><Label zh="很好！" /></p>}
        </div>
        <BottomBar actionLabel="继续" disabled={intro.state === 'ready' || intro.state === 'recording'} onAction={() => setPart('echo')} />
      </>
    );
  }

  if (part === 'echo') {
    const last = phrase >= phrases.length - 1;
    return (
      <>
        <div class="langdu">
          <p class="langdu__step"><Label zh="听一听，说一说" /> <small>{phrase + 1} / {phrases.length}</small></p>
          <p class="langdu__phrase"><Label zh={phrases[phrase] ?? ''} /></p>
          <button type="button" class="btn" onClick={() => speak(phrases[phrase] ?? '')}>
            <Volume2 size={24} strokeWidth={2.5} /> <Label zh="再听" />
          </button>
        </div>
        <BottomBar actionLabel={last ? '开始朗读' : '下一句'} onAction={() => (last ? setPart('read') : setPhrase(phrase + 1))} />
      </>
    );
  }

  if (part === 'read') {
    return (
      <>
        <div class="langdu">
          <h2 class="langdu__title"><Label zh={passage.title} /></h2>
          <p class="passage langdu__passage"><Label zh={displayText(passage.text)} /></p>
          <MicButton rec={read} withLevel />
        </div>
        <BottomBar actionLabel="完成" disabled={read.state !== 'blocked'} onAction={finish} />
      </>
    );
  }

  return (
    <>
      <div class="langdu">
        <h2 class="langdu__title"><Label zh="听听你自己" /></h2>
        <audio controls src={playbackUrl ?? undefined} />
        <button type="button" class="btn" onClick={() => { read.reset(); setPart('read'); }}><Label zh="重录" /></button>
        {withWarmup && <p class="langdu__line langdu__thanks"><Label zh={lines.thanks} /></p>}
      </div>
      <BottomBar actionLabel="完成" onAction={finish} />
    </>
  );
}
