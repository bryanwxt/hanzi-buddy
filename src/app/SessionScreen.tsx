import { Flame, X } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { ComponentsStep } from '../activities/components/ComponentsStep';
import { buildComponentRound, type ComponentQuestion } from '../activities/components/game';
import { FlashcardStep, type FlashResult } from '../activities/flashcards/FlashcardStep';
import { chooseSpeakingPrompt, eligiblePassages, type SpeakingChoice } from '../activities/speaking/prompts';
import { SpeakingStep } from '../activities/speaking/SpeakingStep';
import { WritingStep, type WriteResult } from '../activities/writing/WritingStep';
import type { FinishedRecording } from '../audio/recorder';
import { playSfx } from '../audio/sfx';
import { PASSAGES } from '../content';
import { CLOSEUP_EVERY, closeupAllowed, restingMood } from '../fun/mood';
import { comboMilestone } from '../fun/pet';
import { reducedMotion } from '../ui/motion';
import { localDateKey } from '../lib/date';
import { mulberry32 } from '../lib/random';
import { buildFreePlayQueue } from '../session/plan';
import { markWriteSkipped, recordRecognition, recordWriting, startOrResumeSession } from '../session/record';
import {
  addActiveTime, afterFlashAnswer, afterWriteWord, createFreePlayRecord, currentFlashItem, currentStep,
  currentWriteCandidate, finishStep, skipFlashItem,
} from '../session/runner';
import { addRecording, countRecordings, getKid, listPrompts, saveSession } from '../store/repo';
import { DEFAULT_KID, type KidState, type SessionRecord, type StepKind } from '../types';
import { sessionProgress } from '../session/progress';
import { ProgressBar } from '../ui/ProgressBar';
import { useApp } from './AppContext';
import { Celebration } from './Celebration';
import { loadKnowledge, type Knowledge } from './knowledge';
import { newId } from '../lib/id';
import { InkIcon } from '../ui/icons/InkIcon';


interface Loaded {
  rec: SessionRecord;
  know: Knowledge;
  kid: KidState;
  round: ComponentQuestion[] | null;
  speaking: SpeakingChoice;
}

export function SessionScreen({ free }: { free: boolean }) {
  const { db, now, go, voice } = useApp();
  const [state, setState] = useState<Loaded | null>(null);
  const [combo, setCombo] = useState(0);
  const [correct, setCorrect] = useState(0); // this sitting only: Truffle warms up from sulk
  const cardsSinceCloseup = useRef(CLOSEUP_EVERY);
  const [banner, setBanner] = useState<number | null>(null); // a combo milestone being celebrated
  const stepStartedAt = useRef(performance.now());
  const busy = useRef(false);

  useEffect(() => {
    void (async () => {
      const rng = mulberry32(Date.now() >>> 0);
      const [know, kid, pictures, recordingCount] = await Promise.all([loadKnowledge(db), getKid(db), listPrompts(db), countRecordings(db)]);
      const today = now();
      const rec = free
        ? createFreePlayRecord(buildFreePlayQueue(know.cards, know.words, rng), localDateKey(today), today.getTime())
        : await startOrResumeSession(db, today);
      setState({
        rec,
        know,
        kid: kid ?? DEFAULT_KID,
        round: buildComponentRound([...know.knownChars], rng),
        speaking: chooseSpeakingPrompt({ pictures, passages: eligiblePassages(PASSAGES, know.knownChars), recordingCount, rng }),
      });
    })();
  }, []);

  const rec = state?.rec ?? null;
  const step = rec ? currentStep(rec) : null;
  const flashItem = rec ? currentFlashItem(rec) : null;
  const flashWord = flashItem ? state!.know.wordsById.get(flashItem.wordId) : undefined;
  const writeCandidate = rec ? currentWriteCandidate(rec) : null;
  const writeWord = writeCandidate ? state!.know.wordsById.get(writeCandidate.wordId) : undefined;

  const commit = async (next: SessionRecord) => {
    if (!next.free) await saveSession(db, next);
    stepStartedAt.current = performance.now();
    setState((s) => (s ? { ...s, rec: next } : s));
  };

  // Anything that cannot run is skipped silently: an empty step, or a word paused/deleted since planning.
  useEffect(() => {
    if (!state || !rec) return;
    if (step === 'flashcards' && !flashItem) void commit(finishStep(rec));
    else if (step === 'flashcards' && (!flashWord || flashWord.paused)) void commit(skipFlashItem(rec));
    else if (step === 'writing' && !writeCandidate) void commit(finishStep(rec));
    else if (step === 'writing' && (!writeWord || writeWord.paused)) void commit(afterWriteWord(rec, false, 0));
    else if (step === 'components' && !state.round) void commit(finishStep(rec));
    else if (step === 'speaking' && !state.speaking) void commit(finishStep(rec));
  }, [rec]);

  if (!state || !rec) return <div class="screen loading"><InkIcon name="paw" size={88} label="加载中" /></div>;
  if (rec.completed) return <Celebration rec={rec} />;
  const { know, kid } = state;
  const resting = restingMood(correct);

  const once = (fn: () => Promise<void>) => async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      await fn();
    } finally {
      busy.current = false;
    }
  };

  const finishTimedStep = once(() => commit(finishStep(addActiveTime(rec, Math.round(performance.now() - stepStartedAt.current)))));

  const onFlashDone = (r: FlashResult) =>
    once(async () => {
      const item = flashItem!;
      if (!item.retry && !rec.free) {
        const card = await recordRecognition(db, item.wordId, { correct: r.correct, responseMs: r.responseMs }, now());
        know.cardsById.set(card.id, card);
      }
      const ready = closeupAllowed(cardsSinceCloseup.current, reducedMotion());
      cardsSinceCloseup.current = r.correct && r.hard && ready ? 0 : cardsSinceCloseup.current + 1;
      if (r.correct) setCorrect((n) => n + 1);
      const nextCombo = r.correct ? combo + 1 : 0;
      setCombo(nextCombo);
      if (comboMilestone(nextCombo)) {
        playSfx('combo');
        setBanner(nextCombo);
        setTimeout(() => setBanner(null), 1600);
      }
      await commit(afterFlashAnswer(rec, r.correct, r.elapsedMs));
    })();

  const onWriteDone = (r: WriteResult | null) =>
    once(async () => {
      if (r && !rec.free) await recordWriting(db, writeCandidate!.wordId, r.totalMisses, now());
      if (!r && writeCandidate!.isNew) await markWriteSkipped(db, writeCandidate!.wordId, now());
      await commit(afterWriteWord(rec, r !== null, r?.elapsedMs ?? 0));
    })();

  const onSpeakingSave = async (f: FinishedRecording) => {
    const s = state.speaking!;
    const prompt = s.kind === 'picture' ? { kind: 'picture' as const, promptId: s.prompt.id } : { kind: 'passage' as const, passageId: s.passage.id };
    await addRecording(db, { id: newId(), createdAt: now().getTime(), prompt, ...f });
    await finishTimedStep();
  };

  return (
    <div class="screen">
      <header class="lessonbar">
        <button type="button" class="icon-btn" aria-label="回家" onClick={() => go({ name: 'home' })}>
          <X size={34} strokeWidth={3} />
        </button>
        <ProgressBar steps={rec.plan.steps} stepIndex={rec.stepIndex} fraction={sessionProgress(rec)} />
        {combo >= 3 && <span class="combo"><Flame size={20} strokeWidth={2.75} /> {combo}</span>}
      </header>
      {banner !== null && <div class="combo-banner">连对 {banner} 个！<InkIcon name="flame" size={30} /></div>}

      {step === 'flashcards' && flashItem && flashWord && !flashWord.paused && (
        <FlashcardStep
          key={rec.flashIndex}
          item={flashItem}
          word={flashWord}
          pool={know.words}
          card={know.cardsById.get(`${flashWord.id}:recognise`)}
          voice={voice}
          kid={kid}
          resting={resting}
          combo={combo}
          closeupReady={closeupAllowed(cardsSinceCloseup.current, reducedMotion())}
          onDone={(r) => void onFlashDone(r)}
        />
      )}
      {step === 'writing' && writeWord && !writeWord.paused && (
        <WritingStep key={rec.writeIndex} word={writeWord} kid={kid} resting={resting} isNew={!!writeCandidate?.isNew} onDone={(r) => void onWriteDone(r)} />
      )}
      {step === 'components' && state.round && (
        <ComponentsStep questions={state.round} kid={kid} resting={resting} onDone={() => void finishTimedStep()} />
      )}
      {step === 'speaking' && state.speaking && (
        <SpeakingStep choice={state.speaking} onSave={onSpeakingSave} onSkip={() => void finishTimedStep()} />
      )}
    </div>
  );
}
