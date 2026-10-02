import { pinyin } from 'pinyin-pro';
import { useMemo } from 'preact/hooks';

/** Chinese text with its pinyin shown small above it, for a P2 reader. */
export function Label({ zh }: { zh: string }) {
  const py = useMemo(() => pinyin(zh, { nonZh: 'consecutive' }).replace(/\s+/g, ' ').trim(), [zh]);
  return (
    <span class="label">
      <small class="label__py">{py}</small>
      <span class="label__zh">{zh}</span>
    </span>
  );
}
