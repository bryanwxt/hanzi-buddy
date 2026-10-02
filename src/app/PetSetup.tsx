import { useState } from 'preact/hooks';
import { PET_COLORS } from '../fun/pet';
import { saveKid } from '../store/repo';
import { DEFAULT_KID, type PetColor } from '../types';
import { Label } from '../ui/Label';
import { useApp } from './AppContext';

const COLORS: PetColor[] = ['green', 'blue', 'purple', 'red', 'gold'];

export function PetSetup() {
  const { db, go, refresh } = useApp();
  const [name, setName] = useState(DEFAULT_KID.petName);
  const [color, setColor] = useState<PetColor>('green');

  const done = async () => {
    await saveKid(db, { ...DEFAULT_KID, petName: name.trim() || DEFAULT_KID.petName, petColor: color });
    await refresh();
    go({ name: 'placement' });
  };

  return (
    <div class="screen">
      <div class="center">
        <h1><Label zh="这是你的龙蛋！" /></h1>
        <div style={{ fontSize: '140px' }}>🥚</div>
        <p><Label zh="给你的小龙起个名字" /></p>
        <input class="name-input" aria-label="Pet name" maxLength={6} value={name} onInput={(e) => setName(e.currentTarget.value)} />
        <p><Label zh="选一个颜色" /></p>
        <div class="row">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              class={`swatch ${c === color ? 'is-on' : ''}`}
              aria-label={PET_COLORS[c].zh}
              aria-pressed={c === color}
              onClick={() => setColor(c)}
            >
              <span style={{ filter: `hue-rotate(${PET_COLORS[c].hue}deg)` }}>🐲</span>
            </button>
          ))}
        </div>
        <button type="button" class="btn btn--primary btn--big" onClick={() => void done()}>
          <Label zh="好了！" />
        </button>
      </div>
    </div>
  );
}
