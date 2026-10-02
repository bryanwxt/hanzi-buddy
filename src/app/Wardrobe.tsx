import { useEffect, useState } from 'preact/hooks';
import { BUILTIN } from '../content';
import { POWERS, powerFamilies, powerProgress, type PowerProgress } from '../fun/powers';
import { saveKid } from '../store/repo';
import { DEFAULT_KID, type KidState } from '../types';
import { Label } from '../ui/Label';
import { Pet } from '../ui/Pet';
import { Scene } from '../ui/Scene';
import { TabBar } from '../ui/TabBar';
import { useApp } from './AppContext';
import { loadKnowledge } from './knowledge';

type RoomTab = 'outfits' | 'powers';

/** Truffle's room: what he wears and which power he shows. */
export function Wardrobe() {
  const { db, refresh, kid } = useApp();
  const [k, setK] = useState<KidState>({ ...DEFAULT_KID, ...kid });
  const [tab, setTab] = useState<RoomTab>('outfits');
  const [progress, setProgress] = useState<PowerProgress[] | null>(null);

  useEffect(() => {
    void loadKnowledge(db).then((know) => setProgress(powerProgress(powerFamilies(BUILTIN), know.knownChars)));
  }, []);

  const save = async (next: KidState) => {
    setK(next);
    await saveKid(db, next);
    await refresh();
  };

  return (
    <div class="screen">
      <Scene kind="home" />
      <div class="center room">
        <Pet kid={k} mood="content" size={180} />
        <div class="room__tabs" role="tablist" aria-label="松露的房间">
          <button type="button" role="tab" aria-selected={tab === 'outfits'} class={`chip ${tab === 'outfits' ? 'is-on' : ''}`} onClick={() => setTab('outfits')}>服装</button>
          <button type="button" role="tab" aria-selected={tab === 'powers'} class={`chip ${tab === 'powers' ? 'is-on' : ''}`} onClick={() => setTab('powers')}>能力</button>
        </div>
        {tab === 'outfits' ? (
          k.ownedAccessories.length === 0 ? (
            <p><Label zh="完成练习就能打开宝箱，得到新东西！" /></p>
          ) : (
            <div class="wardrobe stagger" role="tabpanel">
              <button type="button" class={k.wearing === null ? 'is-on' : ''} aria-label="不戴" onClick={() => void save({ ...k, wearing: null })}>🚫</button>
              {k.ownedAccessories.map((a) => (
                <button key={a} type="button" class={k.wearing === a ? 'is-on' : ''} aria-label={a} onClick={() => void save({ ...k, wearing: a })}>{a}</button>
              ))}
            </div>
          )
        ) : (
          <div class="powers" role="tabpanel">
            {POWERS.map((p) => {
              const pr = progress?.find((x) => x.id === p.id);
              const tier = k.powerTiersSeen[p.id] ?? 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  class={`power-row ${k.activePower === p.id ? 'is-on' : ''}`}
                  aria-label={`${p.name} ${pr?.known ?? 0}/${pr?.size ?? 0}`}
                  aria-pressed={k.activePower === p.id}
                  disabled={tier === 0}
                  onClick={() => void save({ ...k, activePower: p.id })}
                >
                  <span class="power-row__mark">{tier > 0 ? p.mark : '🔒'}</span>
                  <span class="power-row__name hanzi">{p.radicals.join(' ')}</span>
                  <span class="power-row__pips" aria-hidden="true">{[1, 2, 3].map((t) => <i key={t} class={t <= tier ? 'is-on' : ''} style={t <= tier ? { background: p.color } : undefined} />)}</span>
                  <span class="power-row__count">{pr?.known ?? 0}/{pr?.size ?? 0}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <TabBar active="wardrobe" />
    </div>
  );
}
