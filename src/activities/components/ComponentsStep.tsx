import { useRef, useState } from 'preact/hooks';
import { playSfx } from '../../audio/sfx';
import { speak } from '../../audio/speech';
import { radicalMeaning } from '../../content/radicals';
import type { KidState } from '../../types';
import { Label } from '../../ui/Label';
import { burst } from '../../ui/motion';
import { Pet } from '../../ui/Pet';
import type { ComponentQuestion, TapAllQuestion, WhichPartQuestion } from './game';

const splash = (el: Element | null | undefined, count = 8) => {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, { count, glyphs: ['💧', '✦', '•'] });
};

interface Props {
  questions: ComponentQuestion[];
  kid: KidState;
  known: number;
  onDone: () => void;
}

export function ComponentsStep({ questions, kid, known, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<boolean | null>(null); // null = not checked yet; true = all right
  const q = questions[index]!;
  const last = index + 1 >= questions.length;

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
    if (last) onDone();
    else setIndex(index + 1);
  };

  return (
    <div class="center">
      <Pet
        kid={kid}
        known={known}
        size={80}
        mood={checked === null ? 'determined' : checked ? 'happy' : 'comfort'}
        bubble={checked === null ? '钓鱼啦！' : checked ? '全对了！' : '看看绿色的！'}
      />
      {q.kind === 'tapAll' ? (
        <TapAll key={index} q={q} checked={checked !== null} onCheck={report} />
      ) : (
        <WhichPart key={index} q={q} checked={checked !== null} onCheck={report} />
      )}
      {checked !== null && (
        <button type="button" class="btn btn--primary" onClick={next}>
          <Label zh={last ? '完成' : '下一题'} />
        </button>
      )}
    </div>
  );
}

function TapAll({ q, checked, onCheck }: { q: TapAllQuestion; checked: boolean; onCheck: (allRight: boolean) => void }) {
  const [caught, setCaught] = useState<Set<string>>(new Set());
  const fishRefs = useRef(new Map<string, HTMLButtonElement>());
  const m = radicalMeaning(q.component);
  const toggle = (c: string) => {
    if (checked) return;
    const next = new Set(caught);
    if (next.has(c)) next.delete(c);
    else {
      next.add(c);
      splash(fishRefs.current.get(c), 6);
    }
    setCaught(next);
  };
  const state = (c: string) => {
    if (!checked) return caught.has(c) ? 'is-caught' : '';
    if (q.answers.includes(c)) return caught.has(c) ? 'is-right' : 'is-right is-missed';
    return caught.has(c) ? 'is-oops' : '';
  };
  const allRight = q.answers.length === caught.size && q.answers.every((a) => caught.has(a));
  return (
    <>
      <div class="pond-q">
        <Label zh="钓出有" />
        <span class="hanzi" style={{ fontSize: '56px' }}>{q.component}</span>
        {m && <span>{m.emoji} {m.zh}</span>}
        <Label zh="的字" />
      </div>
      <div class="pond">
        {q.grid.map((c, i) => (
          <button
            key={c}
            type="button"
            class={`fish ${state(c)}`}
            style={{ animationDelay: `${(i % 4) * 0.3}s` }}
            aria-label={c}
            aria-pressed={caught.has(c)}
            onClick={() => toggle(c)}
            ref={(el) => {
              if (el) fishRefs.current.set(c, el);
            }}
          >
            <span class="fish__body" aria-hidden="true">🐟</span>
            <span class="fish__char" aria-hidden="true">{c}</span>
          </button>
        ))}
      </div>
      {!checked && (
        <button type="button" class="btn btn--good" disabled={!caught.size}
          onClick={() => {
            if (allRight) q.answers.forEach((a) => splash(fishRefs.current.get(a)));
            onCheck(allRight);
          }}
        >
          <Label zh="检查" />
        </button>
      )}
    </>
  );
}

function WhichPart({ q, checked, onCheck }: { q: WhichPartQuestion; checked: boolean; onCheck: (allRight: boolean) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const m = radicalMeaning(q.component)!;
  return (
    <>
      <button type="button" class="hanzi hanzi--xl" style={{ border: 'none', background: 'none' }} onClick={() => speak(q.char)}>
        {q.char}
      </button>
      <div class="pond-q">
        <Label zh="哪个部分是" />
        <span>{m.emoji} {m.zh}</span>
        <Label zh="的意思？" />
      </div>
      <div class="bubbles stagger">
        {q.options.map((o) => (
          <button
            key={o}
            type="button"
            class={`bubble-opt ${checked ? (o === q.component ? 'is-right' : o === picked ? 'is-oops' : '') : ''}`}
            disabled={checked}
            onClick={(e) => {
              setPicked(o);
              if (o === q.component) splash(e.currentTarget, 10);
              onCheck(o === q.component);
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </>
  );
}
