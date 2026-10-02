import { useEffect, useState } from 'preact/hooks';
import { BUILTIN } from '../content';
import { costumeById, ONESIES, OUTFITS } from '../fun/costumes';
import { ACCESSORIES } from '../fun/pet';
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
          <div class="outfits" role="tabpanel">
            {costumeById(k.outfit)?.kind === 'onesie' && k.wearing && <p class="outfits__note"><Label zh="穿着连体衣时看不到小东西" /></p>}
            {([['生肖', ONESIES], ['衣服', OUTFITS]] as const).map(([title, list]) => (
              <section key={title}>
                <h2><Label zh={title} /></h2>
                <div class="outfit-grid">
                  {list.map((c) => {
                    const owned = k.ownedCostumes.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        class={`outfit ${k.outfit === c.id ? 'is-on' : ''}`}
                        aria-label={c.zh}
                        aria-pressed={k.outfit === c.id}
                        disabled={!owned}
                        onClick={() => void save({ ...k, outfit: k.outfit === c.id ? null : c.id })}
                      >
                        <span class="outfit__swatch" style={{ background: owned ? c.color : undefined }}>{owned ? '' : '🔒'}</span>
                        <span class="outfit__name hanzi">{c.zh}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
            <section>
              <h2><Label zh="小东西" /></h2>
              <div class="wardrobe">
                <button type="button" class={k.wearing === null ? 'is-on' : ''} aria-label="不戴" onClick={() => void save({ ...k, wearing: null })}>🚫</button>
                {ACCESSORIES.map((a) => {
                  const owned = k.ownedAccessories.includes(a);
                  return (
                    <button key={a} type="button" class={`${k.wearing === a ? 'is-on' : ''}${owned ? '' : ' is-locked'}`} aria-label={a} disabled={!owned} onClick={() => void save({ ...k, wearing: a })}>{a}</button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div class="powers" role="tabpanel">
            {POWERS.map((p) => {
              const pr = progress?.find((x) => x.id === p.id);
              const tier = k.powerTiersSeen[p.id] ?? 0;
              const ready = (pr?.tier ?? 0) > tier; // earned, unlocked at the next celebration
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
                  <span class="power-row__name hanzi">{p.radicals[0]}</span>
                  {ready && <span class="power-row__ready">✨ <Label zh="完成练习就解锁" /></span>}
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
