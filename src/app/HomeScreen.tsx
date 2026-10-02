import { useEffect, useState } from 'preact/hooks';
import { primeSpeech } from '../audio/speech';
import { goalProgress, nextGoal } from '../fun/rewards';
import { localDateKey } from '../lib/date';
import { streak, totalStars } from '../stats/stats';
import { allSessions, listRewards } from '../store/repo';
import { DEFAULT_KID, type RewardGoal, type SessionRecord } from '../types';
import { celebrate } from '../ui/confetti';
import { Label } from '../ui/Label';
import { Pet } from '../ui/Pet';
import { Scene } from '../ui/Scene';
import { useApp } from './AppContext';
import { loadKnowledge, type Knowledge } from './knowledge';

interface HomeData {
  know: Knowledge;
  sessions: SessionRecord[];
  goals: RewardGoal[];
}

const SLEEP_AFTER_MS = 20_000;

export function HomeScreen({ sleepAfterMs = SLEEP_AFTER_MS }: { sleepAfterMs?: number }) {
  const { db, now, go, kid } = useApp();
  const [data, setData] = useState<HomeData | null>(null);
  const [sleepy, setSleepy] = useState(false);

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

  useEffect(() => {
    void Promise.all([loadKnowledge(db), allSessions(db), listRewards(db)]).then(([know, sessions, goals]) => setData({ know, sessions, goals }));
  }, []);

  const k = kid ?? DEFAULT_KID;
  const stars = data ? totalStars(data.sessions, k.bonusStars) : 0;
  const goal = data ? nextGoal(data.goals) : null;
  const progress = goal && data ? goalProgress(goal, { stars, known: data.know.known }) : null;
  useEffect(() => {
    if (progress?.reached) celebrate();
  }, [progress?.reached]);

  if (!data) return <div class="screen loading">🥚</div>;

  const today = localDateKey(now());
  const todaySession = data.sessions.find((s) => s.date === today);
  const hasCards = data.know.cards.some((c) => c.kind === 'recognise');
  const play = (free: boolean) => {
    primeSpeech();
    go({ name: 'session', free });
  };

  return (
    <div class="screen">
      <Scene kind="home" />
      <header class="topbar">
        <span class="chip">🔥 {streak(data.sessions, today)}</span>
        <span class="chip">⭐ {stars}</span>
        <span class="spacer" />
        <button type="button" class="btn btn--ghost" onClick={() => go({ name: 'stickers' })}>📒 <Label zh="贴纸本" /></button>
        <button type="button" class="btn btn--ghost" aria-label="Parent area" onClick={() => go({ name: 'parent' })}>🔒</button>
      </header>
      <main class="home__main">
        <button type="button" class="pet-button" aria-label="换装" onClick={() => go({ name: 'wardrobe' })}>
          <Pet kid={k} known={data.know.known} mood={sleepy ? 'sleepy' : 'happy'} size={190} />
        </button>
        <div class="home__name">{k.petName}</div>
        <div class="home__known"><Label zh={`我认识 ${data.know.known} 个字`} /></div>
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
        {todaySession?.completed ? (
          <>
            <p class="done-today"><Label zh="今天完成了！" /> 🎉</p>
            {hasCards && (
              <button type="button" class="btn btn--primary btn--big" onClick={() => play(true)}><Label zh="再玩一会儿" /></button>
            )}
          </>
        ) : (
          <>
            <button type="button" class="btn btn--primary btn--big" onClick={() => play(false)}>
              <Label zh={todaySession ? '继续' : '今天的练习'} />
            </button>
            {hasCards && (
              <button type="button" class="btn btn--ghost" onClick={() => play(true)}><Label zh="自由练习" /></button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
