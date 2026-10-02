import { Flame, Star } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import { primeSpeech } from '../audio/speech';
import { pathNodes } from '../fun/path';
import { goalProgress, nextGoal } from '../fun/rewards';
import { localDateKey } from '../lib/date';
import { STEP_ORDER } from '../session/plan';
import { streak, totalStars } from '../stats/stats';
import { allSessions, listRewards } from '../store/repo';
import { DEFAULT_KID, type RewardGoal, type SessionRecord } from '../types';
import { celebrate } from '../ui/confetti';
import { Label } from '../ui/Label';
import { Pet } from '../ui/Pet';
import { Scene } from '../ui/Scene';
import { TabBar } from '../ui/TabBar';
import { useApp } from './AppContext';
import { loadKnowledge, type Knowledge } from './knowledge';
import { TodayPath } from './TodayPath';

interface HomeData {
  know: Knowledge;
  sessions: SessionRecord[];
  goals: RewardGoal[];
}

const SLEEP_AFTER_MS = 20_000;

export function HomeScreen({ sleepAfterMs = SLEEP_AFTER_MS }: { sleepAfterMs?: number }) {
  const { db, now, go, kid, settings } = useApp();
  const [data, setData] = useState<HomeData | null>(null);
  const [sleepy, setSleepy] = useState(false);

  useEffect(() => {
    void Promise.all([loadKnowledge(db), allSessions(db), listRewards(db)]).then(([know, sessions, goals]) => setData({ know, sessions, goals }));
  }, []);

  // The dragon dozes off when nobody is around; any tap wakes it.
  useEffect(() => {
    let timer = setTimeout(() => setSleepy(true), sleepAfterMs);
    const wake = () => {
      setSleepy(false);
      clearTimeout(timer);
      timer = setTimeout(() => setSleepy(true), sleepAfterMs);
    };
    window.addEventListener('pointerdown', wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', wake);
    };
  }, [sleepAfterMs]);

  const k = kid ?? DEFAULT_KID;
  const stars = data ? totalStars(data.sessions, k.bonusStars) : 0;
  const goal = data ? nextGoal(data.goals) : null;
  const progress = goal && data ? goalProgress(goal, { stars, known: data.know.known }) : null;
  useEffect(() => {
    if (progress?.reached) celebrate();
  }, [progress?.reached]);

  if (!data) return <div class="screen loading">🥚</div>;

  const today = localDateKey(now());
  const todaySession = data.sessions.find((s) => s.date === today && !s.free);
  const doneToday = !!todaySession?.completed;
  const chestOpened = k.lastChestDate === today;
  const steps = todaySession?.plan.steps ?? STEP_ORDER.filter((s) => settings.activities[s]);
  const nodes = pathNodes(steps, todaySession?.completedSteps ?? [], chestOpened, doneToday);
  const hasCards = data.know.cards.some((c) => c.kind === 'recognise');
  const days = streak(data.sessions, today);
  const play = (free: boolean) => {
    primeSpeech();
    go({ name: 'session', free });
  };

  return (
    <div class="screen home">
      <Scene kind="home" band />
      <header class="topbar">
        <span class="stat stat--fire" aria-label={`连续 ${days} 天`}><Flame size={24} strokeWidth={2.75} /> {days}</span>
        <span class="stat stat--star" aria-label={`${stars} 颗星`}><Star size={24} strokeWidth={2.75} /> {stars}</span>
        <span class="spacer" />
        <span class="home__who">
          <strong>{k.petName}</strong>
          <Label zh={`认识 ${data.know.known} 个字`} />
        </span>
      </header>
      <main class="home__main">
        {goal && progress && (
          <div class={`goal ${progress.reached ? 'goal--reached' : ''}`}>
            <span class="goal__emoji">{goal.emoji}</span>
            <div class="goal__body">
              <strong>{goal.title}</strong>
              {progress.reached ? (
                <span><Label zh="你做到了！" /> Ask your parent for {goal.emoji}</span>
              ) : (
                <>
                  <div class="progress"><div class="progress__fill" style={{ width: `${Math.round(progress.fraction * 100)}%` }} /></div>
                  <small>{progress.value} / {goal.target} {goal.metric === 'stars' ? '⭐' : '字'}</small>
                </>
              )}
            </div>
          </div>
        )}
        {doneToday && chestOpened && (
          <div class="card done-card">
            <p class="done-today"><Label zh="今天完成了！" /> 🎉</p>
            {hasCards && (
              <button type="button" class="btn btn--secondary" onClick={() => play(true)}><Label zh="再玩一会儿" /></button>
            )}
          </div>
        )}
        <h2 class="home__title"><Label zh="今天的练习" /></h2>
        <TodayPath
          nodes={nodes}
          started={!!todaySession}
          onStart={() => play(false)}
          pet={
            <button type="button" class="pet-button" aria-label="换装" onClick={() => go({ name: 'wardrobe' })}>
              <Pet kid={k} known={data.know.known} mood={sleepy ? 'sleepy' : 'happy'} size={150} />
            </button>
          }
        />
      </main>
      <TabBar active="home" />
    </div>
  );
}
