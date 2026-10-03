import { Flame, Star, Volume2 } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import { enterSafeScreen } from '../pwa';
import { pinyin } from 'pinyin-pro';
import { primeSpeech, speak } from '../audio/speech';
import { pathNodes } from '../fun/path';
import { wordOfTheDay } from '../fun/wordOfDay';
import { goalProgress, nextGoal } from '../fun/rewards';
import { localDateKey } from '../lib/date';
import { STEP_ORDER } from '../session/plan';
import { streak, totalStars, weekDays } from '../stats/stats';
import { pickExample } from '../activities/writing/cue';
import { WeekStrip } from './WeekStrip';
import { allSessions, listRewards, saveKid } from '../store/repo';
import { DEFAULT_KID, type KidState, type RewardGoal, type SessionRecord } from '../types';
import { celebrate } from '../ui/confetti';
import { Label } from '../ui/Label';
import { Pet } from '../ui/Pet';
import { WorldScene } from '../ui/worlds/WorldScene';
import { SCENE_VIEWBOX, SCENES } from '../ui/worlds/scenes';
import { currentWorld, timeOfDay, updateWorlds, worldById, worldLine, type WorldId } from '../fun/worlds';
import { TabBar } from '../ui/TabBar';
import { useApp } from './AppContext';
import { loadKnowledge, type Knowledge } from './knowledge';
import { TodayPath } from './TodayPath';
import { InkIcon } from '../ui/icons/InkIcon';

interface HomeData {
  know: Knowledge;
  sessions: SessionRecord[];
  goals: RewardGoal[];
}

const SLEEP_AFTER_MS = 20_000;

export function HomeScreen({ sleepAfterMs = SLEEP_AFTER_MS }: { sleepAfterMs?: number }) {
  const { db, now, go, kid, settings, refresh } = useApp();
  const [data, setData] = useState<HomeData | null>(null);
  const [sleepy, setSleepy] = useState(false);
  const [arrival, setArrival] = useState<WorldId | null>(null);
  const [journeyKid, setJourneyKid] = useState<KidState | null>(null); // the kid as saved by the journey update, until the app refreshes

  useEffect(() => enterSafeScreen(), []);

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

  const k = journeyKid ?? kid ?? DEFAULT_KID;

  // Journey: record newly reached worlds (never removes any), save before the arrival card shows so it shows once.
  useEffect(() => {
    if (!data) return;
    const u = updateWorlds(kid ?? DEFAULT_KID, data.know.known);
    if (!u.changed) return;
    void (async () => {
      await saveKid(db, u.kid);
      setJourneyKid(u.kid);
      setArrival(u.arrived);
      await refresh();
    })();
  }, [data]);

  const stars = data ? totalStars(data.sessions, k.bonusStars) : 0;
  const goal = data ? nextGoal(data.goals) : null;
  const progress = goal && data ? goalProgress(goal, { stars, known: data.know.known }) : null;
  useEffect(() => {
    if (progress?.reached) celebrate();
  }, [progress?.reached]);

  if (!data) return <div class="screen loading"><InkIcon name="paw" size={88} label="加载中" /></div>;

  const today = localDateKey(now());
  const todaySession = data.sessions.find((s) => s.date === today && !s.free);
  const doneToday = !!todaySession?.completed;
  const chestOpened = k.lastChestDate === today;
  const steps = todaySession?.plan.steps ?? STEP_ORDER.filter((s) => settings.activities[s]);
  const nodes = pathNodes(steps, todaySession?.completedSteps ?? [], chestOpened, doneToday);
  const hasCards = data.know.cards.some((c) => c.kind === 'recognise');
  const days = streak(data.sessions, today);
  const wotd = wordOfTheDay({
    plannedNew: (todaySession?.plan.newWordIds ?? []).map((id) => data.know.wordsById.get(id)?.text ?? ''),
    knownChars: data.know.knownChars,
    date: today,
  });
  const world = currentWorld(k);
  const wotdWord = wotd ? data.know.wordsById.get(`b:${wotd}`) : undefined;
  const wotdExample = wotdWord ? pickExample(wotdWord)?.example ?? null : null;
  const play = (free: boolean) => {
    primeSpeech();
    go({ name: 'session', free });
  };

  return (
    <div class="screen home">
      <WorldScene world={world} time={timeOfDay(now())} />
      <header class="topbar">
        <span class="stat stat--fire" aria-label={`连续 ${days} 天`}><Flame size={24} strokeWidth={2.75} /> {days}</span>
        <span class="stat stat--star" aria-label={`${stars} 颗星`}><Star size={24} strokeWidth={2.75} /> {stars}</span>
        <span class="spacer" />
        <span class="home__who">
          <strong><Label zh="松露" /></strong>
          <Label zh={`认识 ${data.know.known} 个字`} />
        </span>
      </header>
      <div class="home__week">
        <span class="seal" aria-hidden="true">字己</span>
        <WeekStrip days={weekDays(data.sessions, today)} />
      </div>
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
                  <small>{progress.value} / {goal.target} {goal.metric === 'stars' ? <InkIcon name="star" size={16} /> : '字'}</small>
                </>
              )}
            </div>
          </div>
        )}
        {doneToday && chestOpened && (
          <div class="card done-card">
            <p class="done-today"><Label zh="今天完成了！" /> <InkIcon name="party" size={30} /></p>
            {hasCards && (
              <button type="button" class="btn btn--secondary" onClick={() => play(true)}><Label zh="再玩一会儿" /></button>
            )}
          </div>
        )}
        {wotd && (
          <div class="card wotd">
            <button type="button" class="wotd__main" aria-label={`今日一字：${wotd}`} onClick={() => speak(wotd)}>
              <span class="label-tag">今日一字</span>
              <span class="wotd__grid" aria-hidden="true">{wotd}</span>
              <span class="wotd__py" aria-hidden="true">{wotdWord?.pinyin ?? pinyin(wotd)}</span>
            </button>
            {wotdExample && (
              <button type="button" class="wotd__example" aria-label={`听：${wotdExample.text}`} onClick={() => speak(wotdExample.text)}>
                <Label zh={wotdExample.text} py={wotdExample.pinyin} />
                <Volume2 size={22} strokeWidth={2.75} aria-hidden="true" />
              </button>
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
              <Pet kid={k} mood={sleepy ? 'sleepy' : doneToday ? 'pleased' : 'sulk'} size={150} bubble={sleepy ? null : worldLine(world, today)} />
            </button>
          }
        />
      </main>
      {arrival && (
        <div class="arrival" role="dialog" aria-label="新地方">
          <div class="arrival__card">
            <svg class="arrival__scene" viewBox={SCENE_VIEWBOX} preserveAspectRatio="xMidYMax slice" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SCENES[arrival] }} />
            <h2><Label zh={`到${worldById(arrival)!.zh}了！`} /></h2>
            <button type="button" class="btn btn--primary btn--big" onClick={() => setArrival(null)}><Label zh="走吧！" /></button>
          </div>
        </div>
      )}
      <TabBar active="home" />
    </div>
  );
}
