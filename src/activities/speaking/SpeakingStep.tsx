import { Mic, Volume2 } from 'lucide-preact';
import { pinyin } from 'pinyin-pro';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { recordingSupported, startRecording, type ActiveRecording, type FinishedRecording } from '../../audio/recorder';
import { playSfx } from '../../audio/sfx';
import { speak } from '../../audio/speech';
import { BottomBar } from '../../ui/BottomBar';
import { Label } from '../../ui/Label';
import { HELPER_QUESTIONS, type SpeakingChoice } from './prompts';

type Phase = 'ready' | 'recording' | 'review' | 'blocked';

interface Props {
  choice: NonNullable<SpeakingChoice>;
  onSave: (recording: FinishedRecording) => Promise<void>;
  onSkip: () => void;
}

export function SpeakingStep({ choice, onSave, onSkip }: Props) {
  const [phase, setPhase] = useState<Phase>(recordingSupported() ? 'ready' : 'blocked');
  const [finished, setFinished] = useState<FinishedRecording | null>(null);
  const [showPinyin, setShowPinyin] = useState(false);
  const active = useRef<ActiveRecording | null>(null);
  const pictureUrl = useMemo(() => (choice.kind === 'picture' ? URL.createObjectURL(choice.prompt.blob) : null), [choice]);
  const playbackUrl = useMemo(() => (finished ? URL.createObjectURL(finished.blob) : null), [finished]);

  useEffect(() => () => { if (pictureUrl) URL.revokeObjectURL(pictureUrl); }, [pictureUrl]);
  useEffect(() => () => { if (playbackUrl) URL.revokeObjectURL(playbackUrl); }, [playbackUrl]);
  useEffect(() => () => active.current?.cancel(), []);

  const stop = async () => {
    const rec = active.current;
    if (!rec) return;
    active.current = null;
    setFinished(await rec.stop());
    setPhase('review');
  };
  const start = async () => {
    try {
      active.current = await startRecording(() => void stop());
      setPhase('recording');
    } catch {
      setPhase('blocked'); // permission refused or no microphone: never block the session
    }
  };
  const save = async () => {
    if (!finished) return;
    playSfx('star');
    await onSave(finished);
  };

  return (
    <>
    <div class="speak-step">
      {choice.kind === 'picture' ? (
        <>
          <h2 style={{ margin: 0 }}><Label zh="看图说一说" /></h2>
          <img src={pictureUrl!} alt="" />
          <div class="helpers">
            {HELPER_QUESTIONS.map((h) => <span key={h} class="helper"><Label zh={h} /></span>)}
          </div>
        </>
      ) : (
        <>
          <h2 style={{ margin: 0 }}><Label zh={`读一读：${choice.passage.title}`} /></h2>
          <p class="passage">{choice.passage.text}</p>
          {showPinyin && <p class="passage__py">{pinyin(choice.passage.text)}</p>}
          <div class="row">
            <button type="button" class="btn" onClick={() => speak(choice.passage.text)}><Volume2 size={24} strokeWidth={2.5} /> <Label zh="听一听" /></button>
            <button type="button" class="btn btn--ghost" onClick={() => setShowPinyin(!showPinyin)}><Label zh="拼音" /></button>
          </div>
        </>
      )}

        {phase === 'ready' && (
          <button type="button" class="mic-btn" onClick={() => void start()}>
            <Mic size={52} strokeWidth={2.5} />
            <Label zh="开始录音" />
          </button>
        )}
        {phase === 'recording' && (
          <button type="button" class="mic-btn is-recording" onClick={() => void stop()}>
            <span class="rec-dot" />
            <Label zh="停止" />
          </button>
        )}
        {phase === 'review' && (
          <div class="row">
            <audio controls src={playbackUrl ?? undefined} />
            <button type="button" class="btn" onClick={() => { setFinished(null); setPhase('ready'); }}><Label zh="重录" /></button>
          </div>
        )}
        {phase === 'blocked' && (
          <p class="warning">
            <Label zh="麦克风没有打开。我们下次再录！" />
            <br />
            <small>Ask a parent to allow the microphone for this app.</small>
          </p>
        )}
      </div>
      {phase === 'blocked' ? (
        <BottomBar actionLabel="继续" onAction={onSkip} />
      ) : (
        <BottomBar actionLabel="保存" disabled={phase !== 'review'} onAction={() => void save()} />
      )}
    </>
  );
}
