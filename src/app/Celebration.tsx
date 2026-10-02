import { useEffect, useRef, useState } from 'preact/hooks';
import { playSfx } from '../audio/sfx';
import { BUILTIN } from '../content';
import { radicalMeaning } from '../content/radicals';
import { canOpenChest, openChest, petStage, type ChestResult } from '../fun/pet';
import { newBadges, stickerFamilies } from '../fun/stickers';
import { localDateKey } from '../lib/date';
import { totalStars } from '../stats/stats';
import { allSessions, getKid, saveKid } from '../store/repo';
import { DEFAULT_KID, type KidState, type SessionRecord } from '../types';
import { Chest } from '../ui/Chest';
import { celebrate } from '../ui/confetti';
import { Label } from '../ui/Label';
import { burst, flyAlong } from '../ui/motion';
import { Pet } from '../ui/Pet';
import { Scene } from '../ui/Scene';
import { useApp } from './AppContext';
import { loadKnowledge } from './knowledge';

type Phase = 'stars' | 'chest' | 'evolve' | 'badges';

interface Sequence {
  order: Phase[];
  stage: number;
  fromStage: number;
  badges: string[];
  known: number;
  starsBefore: number;
}

export function Celebration({ rec }: { rec: SessionRecord }) {
  const { db, now, go, refresh } = useApp();
  const today = localDateKey(now());
  const kidRef = useRef<KidState>(DEFAULT_KID);
  const counterRef = useRef<HTMLSpanElement>(null);
  const chestRef = useRef<HTMLDivElement>(null);
  const starRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [kid, setKid] = useState<KidState | null>(null);
  const [seq, setSeq] = useState<Sequence | null>(null);
  const [phase, setPhase] = useState<Phase>('stars');
  const [chest, setChest] = useState<ChestResult | null>(null);
  const [landed, setLanded] = useState(0);
  const stars = rec.free ? 0 : rec.completedSteps.length;

  useEffect(() => {
    celebrate();
    void (async () => {
      const [k, know, sessions] = await Promise.all([getKid(db), loadKnowledge(db), allSessions(db)]);
      const kidNow = k ?? DEFAULT_KID;
      const stage = petStage(know.known);
      const badges = newBadges(stickerFamilies(BUILTIN), know.knownChars, kidNow.badgesSeen);
      const order: Phase[] = ['stars'];
      if (!rec.free && canOpenChest(kidNow, today)) order.push('chest');
      if (stage > kidNow.lastStageSeen) order.push('evolve');
      if (badges.length) order.push('badges');
      kidRef.current = kidNow;
      setKid(kidNow);
      setSeq({ order, stage, fromStage: kidNow.lastStageSeen, badges, known: know.known, starsBefore: totalStars(sessions, kidNow.bonusStars) - stars });
    })();
  }, []);

  // Fly each earned star into the counter, one after another.
  useEffect(() => {
    if (!seq) return;
    let cancelled = false;
    void (async () => {
      for (let i = 0; i < stars; i++) {
        const el = starRefs.current[i];
        const c = counterRef.current?.getBoundingClientRect();
        if (el && c) await flyAlong(el, { x: c.left + c.width / 2, y: c.top + c.height / 2 }, { lift: 80, endScale: 0.4, fade: true, duration: 550 });
        if (cancelled) return;
        playSfx('star');
        setLanded((n) => n + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seq]);

  if (!seq || !kid) return <div class="screen loading">⭐</div>;

  const save = async (next: KidState) => {
    kidRef.current = next;
    setKid(next);
    await saveKid(db, next);
  };
  const advance = async () => {
    const nextPhase = seq.order[seq.order.indexOf(phase) + 1];
    if (!nextPhase) {
      await refresh();
      go({ name: 'home' });
      return;
    }
    if (nextPhase === 'evolve') {
      playSfx('levelUp');
      celebrate();
      await save({ ...kidRef.current, lastStageSeen: seq.stage });
    }
    if (nextPhase === 'badges') {
      playSfx('levelUp');
      celebrate();
      await save({ ...kidRef.current, badgesSeen: [...kidRef.current.badgesSeen, ...seq.badges] });
    }
    setPhase(nextPhase);
  };
  const open = async () => {
    const { kid: next, result } = openChest(kidRef.current, today);
    await save(next);
    setChest(result);
    playSfx('chest');
    const r = chestRef.current?.getBoundingClientRect();
    if (r) burst(r.left + r.width / 2, r.top + r.height * 0.35, { count: 16 });
  };

  const isLast = seq.order.indexOf(phase) === seq.order.length - 1;
  const beforeEvolve = seq.order.includes('evolve') && seq.order.indexOf(phase) < seq.order.indexOf('evolve');

  return (
    <div class="screen">
      <Scene kind="night" />
      {!rec.free && (
        <header class="topbar">
          <span class="spacer" />
          <span key={landed} ref={counterRef} class={`chip ${landed ? 'is-bumping' : ''}`}>⭐ {seq.starsBefore + landed}</span>
        </header>
      )}
      <div class="celebrate celebrate--night">
        {phase === 'stars' && (
          <>
            <h1><Label zh={rec.free ? '练习得很好！' : '太棒了！'} /></h1>
            {!rec.free && (
              <>
                <div class="stars stagger">
                  {Array.from({ length: stars }, (_, i) => (
                    <span key={i} ref={(el) => { starRefs.current[i] = el; }}>⭐</span>
                  ))}
                </div>
                <p><Label zh={`你得到了 ${stars} 颗星`} /></p>
              </>
            )}
          </>
        )}
        {phase === 'chest' && (
          <>
            <h1><Label zh={chest ? (chest.kind === 'accessory' ? `${kid.petName}有新东西了！` : `多了 ${chest.amount} 颗星！`) : '宝箱！'} /></h1>
            {chest && <div class="prize">{chest.kind === 'accessory' ? chest.item : '⭐⭐⭐'}</div>}
            <div ref={chestRef}>
              <Chest open={!!chest} onOpen={() => void open()} />
            </div>
            {!chest && <p><Label zh="点一下打开宝箱！" /></p>}
          </>
        )}
        {phase === 'evolve' && <h1><Label zh={`${kid.petName}长大了！`} /></h1>}
        {phase === 'badges' && (
          <>
            <h1><Label zh="新徽章！" /></h1>
            <div class="badges stagger">
              {seq.badges.map((b) => <span key={b} class="badge">🏅 {b} {radicalMeaning(b)?.emoji}</span>)}
            </div>
          </>
        )}
        {phase !== 'chest' && (
          <Pet
            key={phase}
            kid={kid}
            known={seq.known}
            stage={beforeEvolve ? seq.fromStage : seq.stage}
            mood={phase === 'evolve' || phase === 'badges' ? 'cheer' : 'happy'}
            size={phase === 'evolve' ? 230 : 160}
          />
        )}
        {(phase !== 'chest' || chest) && (
          <button type="button" class="btn btn--primary btn--big" onClick={() => void advance()}>
            <Label zh={isLast ? '回家' : '继续'} />
          </button>
        )}
      </div>
    </div>
  );
}
