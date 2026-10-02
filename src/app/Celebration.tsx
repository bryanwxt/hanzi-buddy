import { useEffect, useRef, useState } from 'preact/hooks';
import { playSfx } from '../audio/sfx';
import { BUILTIN } from '../content';
import { radicalMeaning } from '../content/radicals';
import { canOpenChest, openChest, petStage, type ChestResult } from '../fun/pet';
import { newBadges, stickerFamilies } from '../fun/stickers';
import { localDateKey } from '../lib/date';
import { getKid, saveKid } from '../store/repo';
import { DEFAULT_KID, type KidState, type SessionRecord } from '../types';
import { celebrate } from '../ui/confetti';
import { Label } from '../ui/Label';
import { Pet } from '../ui/Pet';
import { useApp } from './AppContext';
import { loadKnowledge } from './knowledge';

type Phase = 'stars' | 'chest' | 'evolve' | 'badges';

interface Sequence {
  order: Phase[];
  stage: number;
  fromStage: number;
  badges: string[];
  known: number;
}

export function Celebration({ rec }: { rec: SessionRecord }) {
  const { db, now, go, refresh } = useApp();
  const today = localDateKey(now());
  const kidRef = useRef<KidState>(DEFAULT_KID);
  const [kid, setKid] = useState<KidState | null>(null);
  const [seq, setSeq] = useState<Sequence | null>(null);
  const [phase, setPhase] = useState<Phase>('stars');
  const [chest, setChest] = useState<ChestResult | null>(null);

  useEffect(() => {
    celebrate();
    playSfx('star');
    void (async () => {
      const k = (await getKid(db)) ?? DEFAULT_KID;
      const know = await loadKnowledge(db);
      const stage = petStage(know.known);
      const badges = newBadges(stickerFamilies(BUILTIN), know.knownChars, k.badgesSeen);
      const order: Phase[] = ['stars'];
      if (!rec.free && canOpenChest(k, today)) order.push('chest');
      if (stage > k.lastStageSeen) order.push('evolve');
      if (badges.length) order.push('badges');
      kidRef.current = k;
      setKid(k);
      setSeq({ order, stage, fromStage: k.lastStageSeen, badges, known: know.known });
    })();
  }, []);

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
    celebrate();
  };

  const isLast = seq.order.indexOf(phase) === seq.order.length - 1;
  const beforeEvolve = seq.order.includes('evolve') && seq.order.indexOf(phase) < seq.order.indexOf('evolve');
  const stars = rec.completedSteps.length;

  return (
    <div class="screen">
      <div class="celebrate">
        {phase === 'stars' && (
          <>
            <h1><Label zh={rec.free ? '练习得很好！' : '太棒了！'} /></h1>
            {!rec.free && (
              <>
                <div class="stars">
                  {Array.from({ length: stars }, (_, i) => <span key={i} style={{ animationDelay: `${i * 0.25}s` }}>⭐</span>)}
                </div>
                <p><Label zh={`你得到了 ${stars} 颗星`} /></p>
              </>
            )}
          </>
        )}
        {phase === 'chest' && !chest && (
          <>
            <h1><Label zh="宝箱！" /></h1>
            <button type="button" class="chest" aria-label="打开宝箱" onClick={() => void open()}>🎁</button>
            <p><Label zh="点一下打开宝箱！" /></p>
          </>
        )}
        {phase === 'chest' && chest && (
          <>
            <div class="prize">{chest.kind === 'accessory' ? chest.item : '⭐⭐⭐'}</div>
            <p><Label zh={chest.kind === 'accessory' ? `${kid.petName}有新东西了！` : `多了 ${chest.amount} 颗星！`} /></p>
          </>
        )}
        {phase === 'evolve' && <h1><Label zh={`${kid.petName}长大了！`} /></h1>}
        {phase === 'badges' && (
          <>
            <h1><Label zh="新徽章！" /></h1>
            <div class="badges">
              {seq.badges.map((b) => <span key={b} class="badge">🏅 {b} {radicalMeaning(b)?.emoji}</span>)}
            </div>
          </>
        )}
        <Pet key={phase} kid={kid} known={seq.known} stage={beforeEvolve ? seq.fromStage : seq.stage} mood="happy" size={phase === 'evolve' ? 200 : 140} />
        {(phase !== 'chest' || chest) && (
          <button type="button" class="btn btn--primary btn--big" onClick={() => void advance()}>
            <Label zh={isLast ? '回家' : '继续'} />
          </button>
        )}
      </div>
    </div>
  );
}
