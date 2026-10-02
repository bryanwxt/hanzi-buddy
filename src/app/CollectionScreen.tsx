import { X } from 'lucide-preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { speak } from '../audio/speech';
import { BUILTIN } from '../content';
import { collectionCards, type CharCard } from '../fun/collection';
import { POWERS, powerDef, type PowerId } from '../fun/powers';
import { completedBadges, stickerFamilies } from '../fun/stickers';
import { Label } from '../ui/Label';
import { Scene } from '../ui/Scene';
import { SpeakButton } from '../ui/SpeakButton';
import { TabBar } from '../ui/TabBar';
import { useApp } from './AppContext';
import { loadKnowledge, type Knowledge } from './knowledge';

type Filter = 'all' | 'gold' | PowerId;

/** 字卡: every built-in character as a collectible card. */
export function CollectionScreen() {
  const { db, kid } = useApp();
  const families = useMemo(() => stickerFamilies(BUILTIN), []);
  const [know, setKnow] = useState<Knowledge | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState<CharCard | null>(null);

  useEffect(() => {
    void loadKnowledge(db).then(setKnow);
  }, []);
  const cards = useMemo(() => (know ? collectionCards(BUILTIN, know) : []), [know]);

  if (!know) return <div class="screen loading">🐾</div>;

  const caught = cards.filter((c) => c.caught).length;
  const visible = cards.filter((c) => (filter === 'all' ? true : filter === 'gold' ? c.gold : c.power === filter));
  const badges = [...new Set([...(kid?.badgesSeen ?? []), ...completedBadges(families, know.knownChars)])];
  const myWords = know.words.filter((w) => w.source === 'parent' && know.knownWordIds.has(w.id));
  const show = (c: CharCard) => {
    setShown(c);
    speak(c.char);
  };

  return (
    <div class="screen">
      <Scene kind="home" />
      <header class="topbar">
        <h1 style={{ margin: 0 }}><Label zh="字卡" /></h1>
        <span class="spacer" />
        <span class="chip">{caught} / {cards.length}</span>
      </header>
      <div class="filters" role="group" aria-label="筛选">
        <button type="button" class={`chip ${filter === 'all' ? 'is-on' : ''}`} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>全部</button>
        {POWERS.map((p) => (
          <button key={p.id} type="button" class={`chip ${filter === p.id ? 'is-on' : ''}`} aria-pressed={filter === p.id} aria-label={`${p.mark} ${p.name}`} onClick={() => setFilter(p.id)}>
            {p.mark} <span class="hanzi">{p.name}</span>
          </button>
        ))}
        <button type="button" class={`chip ${filter === 'gold' ? 'is-on' : ''}`} aria-pressed={filter === 'gold'} onClick={() => setFilter('gold')}>✨ 金卡</button>
      </div>
      <div class="zika-grid">
        {visible.map((c) =>
          c.caught ? (
            <button key={c.char} type="button" class={`zika${c.gold ? ' card--gold' : ''}${c.rarity === 'rare' ? ' card--rare' : ''}`} aria-label={c.char} onClick={() => show(c)}>
              <span class="zika__py">{c.pinyin}</span>
              <span class="zika__char hanzi">{c.char}</span>
              <span class="zika__foot">
                <span class="zika__stars">{'★'.repeat(c.stars)}</span>
                {c.power && <span>{powerDef(c.power)!.mark}</span>}
              </span>
            </button>
          ) : (
            <button key={c.char} type="button" class="zika card--back" aria-label="未收集" disabled>
              {c.power ? powerDef(c.power)!.mark : '？'}
            </button>
          ),
        )}
      </div>
      <h2><Label zh="徽章" /></h2>
      <div class="badges">
        {badges.length ? badges.map((b) => <span key={b} class="badge">🏅 {b}</span>) : <Label zh="集齐一个家族就能得到徽章！" />}
      </div>
      {myWords.length > 0 && (
        <>
          <h2><Label zh="我的字" /></h2>
          <div class="zika-grid">
            {myWords.map((w) => (
              <button key={w.id} type="button" class="zika" aria-label={w.text} onClick={() => speak(w.text)}>
                <span class="zika__py">{w.pinyin}</span>
                <span class="zika__char hanzi" style={{ fontSize: w.text.length > 2 ? '28px' : '44px' }}>{w.text}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {shown && (
        <div class="zika-big" role="dialog" aria-label={`字卡：${shown.char}`} onClick={() => setShown(null)}>
          <div class={`zika zika--big${shown.gold ? ' card--gold' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button type="button" class="icon-btn zika-big__close" aria-label="关闭" onClick={() => setShown(null)}><X size={30} strokeWidth={3} /></button>
            <span class="zika__py">{shown.pinyin}</span>
            <span class="zika__char hanzi">{shown.char}</span>
            <SpeakButton text={shown.char} />
            {shown.example && <span class="zika__example hanzi">{shown.example} <SpeakButton text={shown.example} /></span>}
            <span class="zika__stars">{'★'.repeat(shown.stars)}{'☆'.repeat(3 - shown.stars)}</span>
          </div>
        </div>
      )}
      <TabBar active="stickers" />
    </div>
  );
}
