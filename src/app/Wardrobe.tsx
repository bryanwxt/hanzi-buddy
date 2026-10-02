import { useEffect, useState } from 'preact/hooks';
import { saveKid } from '../store/repo';
import { DEFAULT_KID } from '../types';
import { Label } from '../ui/Label';
import { Pet } from '../ui/Pet';
import { Scene } from '../ui/Scene';
import { useApp } from './AppContext';
import { loadKnowledge } from './knowledge';

export function Wardrobe() {
  const { db, go, refresh, kid } = useApp();
  const [k, setK] = useState(kid ?? DEFAULT_KID);
  const [known, setKnown] = useState(0);

  useEffect(() => {
    void loadKnowledge(db).then((x) => setKnown(x.known));
  }, []);

  const wear = async (item: string | null) => {
    const next = { ...k, wearing: item };
    setK(next);
    await saveKid(db, next);
    await refresh();
  };

  return (
    <div class="screen">
      <Scene kind="home" />
      <header class="topbar">
        <button type="button" class="btn btn--ghost" onClick={() => go({ name: 'home' })}>← <Label zh="回家" /></button>
      </header>
      <div class="center">
        <Pet kid={k} known={known} size={180} />
        <h1><Label zh="换装" /></h1>
        {k.ownedAccessories.length === 0 ? (
          <p><Label zh="完成练习就能打开宝箱，得到新东西！" /></p>
        ) : (
          <div class="wardrobe stagger">
            <button type="button" class={k.wearing === null ? 'is-on' : ''} aria-label="不戴" onClick={() => void wear(null)}>🚫</button>
            {k.ownedAccessories.map((a) => (
              <button key={a} type="button" class={k.wearing === a ? 'is-on' : ''} aria-label={a} onClick={() => void wear(a)}>{a}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
