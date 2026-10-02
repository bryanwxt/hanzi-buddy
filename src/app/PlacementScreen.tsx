import { useEffect, useState } from 'preact/hooks';
import { applyPlacement } from '../placement/apply';
import { pickPlacementSamples, placementCutoff } from '../placement/placement';
import { allWords } from '../store/repo';
import { DEFAULT_KID, type Word } from '../types';
import { Label } from '../ui/Label';
import { Pet } from '../ui/Pet';
import { Scene } from '../ui/Scene';
import { useApp } from './AppContext';
import { loadKnowledge } from './knowledge';

export function PlacementScreen() {
  const { db, now, go, refresh, kid } = useApp();
  const [samples, setSamples] = useState<Word[] | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [known, setKnown] = useState<number | null>(null);

  useEffect(() => {
    void allWords(db).then((w) => setSamples(pickPlacementSamples(w)));
  }, []);

  const answer = async (knows: boolean) => {
    if (!samples || known !== null) return;
    const next = [...answers, knows];
    setAnswers(next);
    if (!knows || next.length === samples.length) {
      await applyPlacement(db, placementCutoff(samples.slice(0, next.length), next), now());
      setKnown((await loadKnowledge(db)).known);
    }
  };

  const k = kid ?? DEFAULT_KID;
  if (!samples) return <div class="screen loading">🥚</div>;

  if (known !== null) {
    return (
      <div class="screen">
      <Scene kind="home" />
        <div class="center">
          <Pet kid={k} known={known} mood="happy" size={160} />
          <h1><Label zh={`你已经认识 ${known} 个字了！`} /></h1>
          <p><Label zh="我们每天学一点点。" /></p>
          <button type="button" class="btn btn--primary btn--big" onClick={async () => { await refresh(); go({ name: 'home' }); }}>
            <Label zh="开始！" />
          </button>
        </div>
      </div>
    );
  }

  const current = samples[answers.length];
  return (
    <div class="screen">
      <Scene kind="home" />
      <div class="center">
        <Pet kid={k} known={0} bubble="你认识这个字吗？" size={100} />
        <div class="hanzi hanzi--xl">{current?.text}</div>
        <div class="row">
          <button type="button" class="btn btn--good btn--big" onClick={() => void answer(true)}><Label zh="认识" /> ✓</button>
          <button type="button" class="btn btn--big" onClick={() => void answer(false)}><Label zh="不认识" /> 🤔</button>
        </div>
        <small>{answers.length + 1} / {samples.length}</small>
      </div>
    </div>
  );
}
