import { useRef, useState } from 'preact/hooks';
import { playSfx } from '../../audio/sfx';
import { speak } from '../../audio/speech';
import { radicalMeaning } from '../../content/radicals';
import type { KidState } from '../../types';
import { BottomBar } from '../../ui/BottomBar';
import { Label } from '../../ui/Label';
import { burst } from '../../ui/motion';
import { Pet } from '../../ui/Pet';
import type { TruffleMood } from '../../ui/truffle/Truffle';
import type { ComponentQuestion } from './game';

const splash = (el: Element | null | undefined, count = 8) => {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, { count, glyphs: ['💧', '✦', '•'] });
};

interface Props {
  questions: ComponentQuestion[];
  kid: KidState;
  resting: TruffleMood;
  onDone: () => void;
}

export function ComponentsStep({ questions, kid, resting, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<boolean | null>(null); // null = not checked yet; true = all right
  const [caught, setCaught] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<string | null>(null);
  const fishRefs = useRef(new Map<string, HTMLButtonElement>());
  const q = questions[index]!;
  const last = index + 1 >= questions.length;
  const m = radicalMeaning(q.component);

  const report = (allRight: boolean) => {
    setChecked(allRight);
    if (allRight) {
      playSfx('correct');
      playSfx('star');
    } else {
      playSfx('wrong');
    }
  };
  const next = () => {
    setChecked(null);
    setCaught(new Set());
    setPicked(null);
    if (last) onDone();
    else setIndex(index + 1);
  };
  const toggle = (c: string) => {
    if (checked !== null) return;
    const nextSet = new Set(caught);
    if (nextSet.has(c)) nextSet.delete(c);
    else {
      nextSet.add(c);
      splash(fishRefs.current.get(c), 6);
    }
    setCaught(nextSet);
  };
  const check = () => {
    if (q.kind !== 'tapAll') return;
    const allRight = q.answers.length === caught.size && q.answers.every((a) => caught.has(a));
    if (allRight) q.answers.forEach((a) => splash(fishRefs.current.get(a)));
    report(allRight);
  };
  const pick = (o: string, el: Element) => {
    if (checked !== null || q.kind !== 'whichPart') return;
    setPicked(o);
    if (o === q.component) splash(el, 10);
    report(o === q.component);
  };
  const fishState = (c: string) => {
    if (q.kind !== 'tapAll') return '';
    if (checked === null) return caught.has(c) ? 'is-caught' : '';
    if (q.answers.includes(c)) return caught.has(c) ? 'is-right' : 'is-right is-missed';
    return caught.has(c) ? 'is-oops' : '';
  };

  return (
    <>
      <div class="center components">
        <Pet
          kid={kid}
          size={110}
          mood={checked === null ? resting : checked ? 'pleased' : 'side'}
          bubble={checked === null ? (q.kind === 'tapAll' ? '钓鱼啦！' : '找一找！') : null}
        />
        {q.kind === 'tapAll' ? (
          <>
            <div class="pond-q">
              <Label zh="钓出有" />
              <span class="pond-q__part hanzi">{q.component}</span>
              {m && <span class="pond-q__meaning">{m.emoji} {m.zh}</span>}
              <Label zh="的字" />
            </div>
            <div class="pond">
              {q.grid.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  class={`fishtile press ${fishState(c)}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                  aria-label={c}
                  aria-pressed={caught.has(c)}
                  onClick={() => toggle(c)}
                  ref={(el) => {
                    if (el) fishRefs.current.set(c, el);
                  }}
                >
                  <span class="fishtile__char hanzi">{c}</span>
                  <span class="fishtile__badge" aria-hidden="true">🐟</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button type="button" class="whichpart__char hanzi" onClick={() => speak(q.char)}>{q.char}</button>
            <div class="pond-q">
              <Label zh="哪个部分是" />
              {m && <span class="pond-q__meaning">{m.emoji} {m.zh}</span>}
              <Label zh="的意思？" />
            </div>
            <div class="bubbles stagger">
              {q.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  class={`bubble-opt press ${checked !== null ? (o === q.component ? 'is-right' : o === picked ? 'is-oops' : '') : ''}`}
                  disabled={checked !== null}
                  onClick={(e) => pick(o, e.currentTarget)}
                >
                  {o}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {checked === null ? (
        q.kind === 'tapAll' ? (
          <BottomBar actionLabel="检查" disabled={!caught.size} onAction={check} />
        ) : (
          <BottomBar actionLabel="继续" disabled onAction={() => {}} />
        )
      ) : (
        <BottomBar
          tone={checked ? 'good' : 'oops'}
          title={checked ? '全对了！' : q.kind === 'tapAll' ? '看看绿色的！' : '是这个！'}
          detail={
            !checked && q.kind === 'whichPart' ? (
              <>
                <span class="hanzi">{q.component}</span> {m?.emoji} {m?.zh}
              </>
            ) : undefined
          }
          actionLabel="继续"
          onAction={next}
        />
      )}
    </>
  );
}
