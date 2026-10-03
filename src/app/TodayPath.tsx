import { Check } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { PathKind, PathNode } from '../fun/path';
import { Label } from '../ui/Label';
import { InkIcon } from '../ui/icons/InkIcon';
import type { IconName } from '../ui/icons/icons';

const ICON: Record<PathKind, IconName | null> = { flashcards: null, writing: 'pen', components: 'fish', speaking: 'mic', chest: 'gift' };
const NAME: Record<PathKind, string> = { flashcards: '认一认', writing: '写一写', components: '钓鱼', speaking: '说一说', chest: '宝箱' };

interface Props {
  nodes: PathNode[];
  started: boolean;
  onStart: () => void;
  pet: ComponentChildren;
}

export function TodayPath({ nodes, started, onStart, pet }: Props) {
  const ref = useRef<HTMLOListElement>(null);
  const currentIndex = nodes.findIndex((n) => n.state === 'current');
  const verb = started ? '继续' : '开始';

  useEffect(() => {
    (ref.current?.querySelector('[aria-current="step"]') as HTMLElement | null)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, []);

  return (
    <ol class="path" ref={ref} aria-label="今天的练习">
      {nodes.map((n, i) => {
        const isCurrent = n.state === 'current';
        const icon = n.state === 'done' ? (n.kind === 'chest' ? <InkIcon name="party" size={44} /> : <Check size={38} strokeWidth={3.5} />) : ICON[n.kind] ? <InkIcon name={ICON[n.kind]!} size={44} /> : '字';
        return (
          <li key={n.kind} class="path__row" style={`--x:${Math.round(Math.sin((i * Math.PI) / 2) * 80)}px`}>
            {isCurrent && <div class="path__bubble"><Label zh={verb} /></div>}
            <button
              type="button"
              class={`path__node path__node--${n.state}`}
              aria-label={isCurrent ? `${verb}：${NAME[n.kind]}` : NAME[n.kind]}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={isCurrent ? onStart : undefined}
            >
              <span class={`path__icon${icon === '字' ? ' path__icon--hanzi' : ''}`}>{icon}</span>
            </button>
            <span class="path__name"><Label zh={NAME[n.kind]} /></span>
            {i === Math.max(0, currentIndex) && <div class="path__pet">{pet}</div>}
          </li>
        );
      })}
    </ol>
  );
}
