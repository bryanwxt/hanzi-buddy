import { useEffect, useMemo, useState } from 'preact/hooks';
import { speak } from '../audio/speech';
import { BUILTIN } from '../content';
import { completedBadges, familyProgress, stickerFamilies } from '../fun/stickers';
import { Label } from '../ui/Label';
import { Scene } from '../ui/Scene';
import { useApp } from './AppContext';
import { loadKnowledge, type Knowledge } from './knowledge';

const tilt = (text: string) => `--tilt:${(text.codePointAt(0)! % 7) - 3}deg`;

export function StickerBook() {
  const { db, go } = useApp();
  const families = useMemo(() => stickerFamilies(BUILTIN), []);
  const [know, setKnow] = useState<Knowledge | null>(null);
  const [open, setOpen] = useState<string | null>(null); // a family's component, or 'mine'

  useEffect(() => {
    void loadKnowledge(db).then(setKnow);
  }, []);

  if (!know) return <div class="screen loading">📒</div>;

  const family = families.find((f) => f.component === open);
  const badges = completedBadges(families, know.knownChars);
  const myWords = know.words.filter((w) => w.source === 'parent' && know.knownWordIds.has(w.id));
  const back = () => (open ? setOpen(null) : go({ name: 'home' }));

  return (
    <div class="screen">
      <Scene kind="home" />
      <header class="topbar">
        <button type="button" class="btn btn--ghost" onClick={back}>← <Label zh={open ? '贴纸本' : '回家'} /></button>
        <h1 style={{ margin: 0 }}>
          {family ? (
            <>{family.meaning.emoji} <span class="hanzi">{family.component}</span> <Label zh={`${family.meaning.zh}家族`} /></>
          ) : (
            <Label zh={open === 'mine' ? '我的词语' : '贴纸本'} />
          )}
        </h1>
      </header>

      {family ? (
        <div class="sticker-grid">
          {family.chars.map((c) =>
            know.knownChars.has(c) ? (
              <button key={c} type="button" class="sticker" style={tilt(c)} aria-label={c} onClick={() => speak(c)}>{c}</button>
            ) : (
              <div key={c} class="sticker sticker--unknown" aria-label="还没学">？</div>
            ),
          )}
        </div>
      ) : open === 'mine' ? (
        myWords.length === 0 ? (
          <p><Label zh="还没有。" /></p>
        ) : (
          <div class="sticker-grid">
            {myWords.map((w) => (
              <button key={w.id} type="button" class="sticker" style={`${tilt(w.text)};font-size:${w.text.length > 2 ? 28 : 40}px`} aria-label={w.text} onClick={() => speak(w.text)}>
                {w.text}
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          <div class="badges">
            {badges.length ? badges.map((b) => <span key={b} class="badge">🏅 {b}</span>) : <Label zh="集齐一个家族就能得到徽章！" />}
          </div>
          <div class="book">
            {families.map((f) => {
              const p = familyProgress(f, know.knownChars);
              return (
                <button key={f.component} type="button" class="family" aria-label={`${f.component} ${p.known}/${p.total}`} onClick={() => setOpen(f.component)}>
                  <span class="family__icon">{f.meaning.emoji}</span>
                  <span class="family__name">{f.component}</span>
                  <span>{p.known} / {p.total}</span>
                  <div class="progress" style={{ width: '100%' }}>
                    <div class="progress__fill" style={{ width: `${(p.known / p.total) * 100}%` }} />
                  </div>
                </button>
              );
            })}
            <button type="button" class="family" aria-label="我的词语" onClick={() => setOpen('mine')}>
              <span class="family__icon">📝</span>
              <Label zh="我的词语" />
              <span>{myWords.length}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
