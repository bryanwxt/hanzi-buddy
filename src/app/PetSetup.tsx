import { useState } from 'preact/hooks';
import { saveKid } from '../store/repo';
import { DEFAULT_KID } from '../types';
import { Label } from '../ui/Label';
import { Scene } from '../ui/Scene';
import { Truffle } from '../ui/truffle/Truffle';
import { useApp } from './AppContext';

/** First run: meet Truffle 松露 (the family's cat), then go to placement. */
export function PetSetup() {
  const { db, go, refresh } = useApp();
  const [awake, setAwake] = useState(false);

  const done = async () => {
    await saveKid(db, { ...DEFAULT_KID, petName: '松露' });
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
          <div class="pet">
            {awake && <div class="pet__bubble">哼……我是松露。来吧！</div>}
            <button type="button" class="pet-button" aria-label="叫醒松露" onClick={() => setAwake(true)}>
              <Truffle mood={awake ? 'sulk' : 'sleepy'} size={240} bounce={awake} label={null} />
            </button>
          </div>
        </div>
        <div class="setup__form">
          <h2><Label zh={awake ? '这是松露！' : '松露在睡觉……'} /></h2>
          <p><Label zh={awake ? '他有点儿凶，可是你答对了，他就会开心！' : '点一下，叫醒他！'} /></p>
          <button type="button" class="btn btn--primary btn--big" disabled={!awake} onClick={() => void done()}>
            <Label zh="好！" />
          </button>
        </div>
      </div>
    </div>
  );
}
