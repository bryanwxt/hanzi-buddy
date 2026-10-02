import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { playSfx } from '../../audio/sfx';
import { speak } from '../../audio/speech';
import { getCharInfo, hanChars } from '../../content';
import { radicalMeaning } from '../../content/radicals';
import { CHEERS, COMFORTS, pickLine } from '../../fun/pet';
import { mulberry32, shuffle } from '../../lib/random';
import type { CardRecord, FlashItem, KidState, Word } from '../../types';
import { Label } from '../../ui/Label';
import { Pet } from '../../ui/Pet';
import { SpeakButton } from '../../ui/SpeakButton';
import { pickCharacterDistractors, pickPinyinDistractors } from './distractors';

export interface FlashResult {
  correct: boolean;
  responseMs: number;
  elapsedMs: number;
}

interface Props {
  item: FlashItem;
  word: Word;
  pool: Word[];
  card?: CardRecord;
  voice: boolean;
  kid: KidState;
  known: number;
  onDone: (result: FlashResult) => void;
}

type Phase = 'intro' | 'quiz' | 'feedback';

export function FlashcardStep({ item, word, pool, card, voice, kid, known, onDone }: Props) {
  const quiz = useMemo(() => {
    const rng = mulberry32((Date.now() ^ word.text.codePointAt(0)!) >>> 0);
    const lookAlikes = pickCharacterDistractors(word, pool, rng);
    const listen = voice && lookAlikes.length > 0 && (card?.fsrs.reps ?? 0) % 2 === 0;
    const answer = listen ? word.text : word.pinyin;
    const wrong = listen ? lookAlikes.map((w) => w.text) : pickPinyinDistractors(word, pool, rng);
    return { listen, answer, options: shuffle([answer, ...wrong], rng), cheer: pickLine(CHEERS, rng), comfort: pickLine(COMFORTS, rng) };
  }, [word.id]);
  const [phase, setPhase] = useState<Phase>(item.isNew && !item.retry ? 'intro' : 'quiz');
  const [choice, setChoice] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; responseMs: number } | null>(null);
  const shownAt = useRef(performance.now());
  const quizAt = useRef(performance.now());

  useEffect(() => {
    if (phase === 'intro') speak(word.text);
    if (phase === 'quiz') {
      quizAt.current = performance.now();
      if (quiz.listen) speak(word.text);
    }
  }, [phase]);

  const choose = (option: string) => {
    if (phase !== 'quiz') return;
    const correct = option === quiz.answer;
    setChoice(option);
    setResult({ correct, responseMs: Math.round(performance.now() - quizAt.current) });
    setPhase('feedback');
    if (correct) {
      playSfx('munch');
      setTimeout(() => playSfx('correct'), 250);
    } else {
      playSfx('wrong');
    }
    if (!quiz.listen || !correct) speak(word.text);
  };

  const optionState = (o: string) => {
    if (phase !== 'feedback') return '';
    if (o === quiz.answer) return o === choice ? 'is-eaten' : 'is-answer';
    return o === choice ? 'is-wrong' : 'is-dim';
  };

  const bubble =
    phase === 'intro' ? '新字来了！'
    : phase === 'feedback' ? (result!.correct ? quiz.cheer : quiz.comfort)
    : quiz.listen ? '我想吃这个字！' : '这个字怎么读？';
  const mood = phase === 'feedback' ? (result!.correct ? 'munch' : 'comfort') : null;

  return (
    <div class="flash">
      <div class="flash__pet">
        <Pet kid={kid} known={known} mood={mood} bubble={bubble} size={140} />
      </div>
      <div class="flash__main">
        {phase === 'intro' ? (
          <Intro word={word} onReady={() => setPhase('quiz')} />
        ) : (
          <>
            <div class="flash__prompt">
              {quiz.listen ? <SpeakButton text={word.text} big /> : <div class="hanzi hanzi--xl">{word.text}</div>}
            </div>
            <div class={`choices ${quiz.listen ? 'choices--hanzi' : 'choices--pinyin'}`}>
              {quiz.options.map((o) => (
                <button key={o} type="button" class={`choice ${optionState(o)}`} disabled={phase === 'feedback'} onClick={() => choose(o)}>
                  {o}
                </button>
              ))}
            </div>
            {phase === 'feedback' && result && (
              <div class="flash__next">
                {!result.correct && (
                  <p class="answer-reveal">
                    <span class="hanzi">{word.text}</span> {word.pinyin} <SpeakButton text={word.text} />
                  </p>
                )}
                <button
                  type="button"
                  class="btn btn--primary"
                  onClick={() => onDone({ ...result, elapsedMs: Math.round(performance.now() - shownAt.current) })}
                >
                  <Label zh="下一个" /> →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Intro({ word, onReady }: { word: Word; onReady: () => void }) {
  return (
    <div class="intro">
      <div class="intro__card">
        <div class="pinyin">{word.pinyin}</div>
        <div class="hanzi hanzi--xl">{word.text}</div>
        <SpeakButton text={word.text} />
        {word.meaning && <div class="meaning">{word.meaning}</div>}
        {hanChars(word.text).map((ch) => {
          const info = getCharInfo(ch);
          const parts = info?.components ?? [];
          if (!info || parts.length < 2) return null;
          return (
            <div class="parts" key={ch}>
              {parts.map((p, i) => {
                const m = p === info.radical ? radicalMeaning(p) : undefined;
                return (
                  <span key={p} class={m ? 'part--radical' : ''}>
                    {i > 0 ? '+ ' : ''}
                    {p}
                    {m ? ` ${m.emoji}` : ''}
                  </span>
                );
              })}
            </div>
          );
        })}
        {word.examples?.map((e) => (
          <div class="example" key={e.text}>
            <span class="pinyin">{e.pinyin}</span>
            <span class="hanzi">{e.text}</span>
            <SpeakButton text={e.text} />
          </div>
        ))}
      </div>
      <button type="button" class="btn btn--primary" onClick={onReady}>
        <Label zh="我记住了！" />
      </button>
    </div>
  );
}
