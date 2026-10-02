import { Home, Lock, Shirt, Sticker } from 'lucide-preact';
import { useApp, type Route } from '../app/AppContext';

export type Tab = 'home' | 'stickers' | 'wardrobe' | 'parent';

const TABS: { id: Tab; zh: string; Icon: typeof Home }[] = [
  { id: 'home', zh: '首页', Icon: Home },
  { id: 'stickers', zh: '贴纸', Icon: Sticker },
  { id: 'wardrobe', zh: '小龙', Icon: Shirt },
  { id: 'parent', zh: '家长', Icon: Lock },
];

export function TabBar({ active }: { active: Tab }) {
  const { go } = useApp();
  return (
    <nav class="tabbar" aria-label="主菜单">
      {TABS.map(({ id, zh, Icon }) => (
        <button
          key={id}
          type="button"
          class={`tabbar__item ${id === active ? 'is-active' : ''}`}
          aria-current={id === active ? 'page' : undefined}
          onClick={() => go({ name: id } as Route)}
        >
          <Icon size={30} strokeWidth={2.5} />
          <span>{zh}</span>
        </button>
      ))}
    </nav>
  );
}
