import { useState } from 'preact/hooks';
import { saveKid } from '../store/repo';
import { DEFAULT_KID } from '../types';
import { Truffle } from '../ui/truffle/Truffle';
import { Label } from '../ui/Label';
import { Scene } from '../ui/Scene';
import { useApp } from './AppContext';

export function PetSetup() {
  const { db, go, refresh } = useApp();
  const [name, setName] = useState(DEFAULT_KID.petName);

  const done = async () => {
    await saveKid(db, { ...DEFAULT_KID, petName: name.trim() || DEFAULT_KID.petName });
    await refresh();
    go({ name: 'placement' });
  };

  return (
    <div class="screen">
      <Scene kind="home" />
      <div class="setup">
        <div class="setup__pet">
          <h1 class="brand">字己</h1>
          {/* The name is a pun on 自己; spelling it out keeps 自己 right in his school 听写. */}
          <p class="pun"><b class="pun__hl">字</b>己 = <b class="pun__hl">自</b>己学汉字！</p>
          <Truffle mood="neutral" size={240} />
          <h2><Label zh="这是你的龙蛋！" /></h2>
        </div>
        <div class="setup__form">
          <p><Label zh="给你的小龙起个名字" /></p>
          <input class="name-input" aria-label="Pet name" maxLength={6} value={name} onInput={(e) => setName(e.currentTarget.value)} />
          <button type="button" class="btn btn--primary btn--big" onClick={() => void done()}>
            <Label zh="好了！" />
          </button>
        </div>
      </div>
    </div>
  );
}
