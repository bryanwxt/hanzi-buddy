import { pinyin } from 'pinyin-pro';
import { useMemo } from 'preact/hooks';

interface Cell {
  py: string;
  ch: string;
}

/** Chinese text with each syllable shown small directly above its own character, for a P2 reader. */
export function Label({ zh, py: given }: { zh: string; /** syllables for its Han characters, from context (子 in 儿子 is zi) */ py?: string }) {
  const { cells, py } = useMemo(() => {
    const out: Cell[] = [];
    const all = pinyin(zh, { type: 'all' });
    const ctx = given?.trim().split(/\s+/);
    const fits = ctx && ctx.length === all.filter((d) => d.isZh).length;
    let k = 0;
    for (const d of all) {
      if (d.isZh) out.push({ py: fits ? ctx[k++]! : d.pinyin, ch: d.origin });
      else if (out.length && out[out.length - 1]!.py === '') out[out.length - 1]!.ch += d.origin; // keep "45" or "！" runs together
      else out.push({ py: '', ch: d.origin });
    }
    // data-py: the syllables plus any numbers or Latin text, without punctuation
    const py = out.map((c) => c.py || (/[\p{L}\p{N}]/u.test(c.ch) ? c.ch.trim() : '')).filter(Boolean).join(' ');
    return { cells: out, py };
  }, [zh, given]);
  return (
    <span class="label" data-py={py}>
      {/* one cell already reads as the whole text; several get a single readable copy so 你好 isn't read 你…好 */}
      {cells.length > 1 && <span class="sr-only">{zh}</span>}
      <span class="label__cells" aria-hidden={cells.length > 1 ? 'true' : undefined}>
        {cells.map((c, i) => (
          <span key={i} class={c.py ? 'label__cell label__cell--zh' : 'label__cell'}>
            <small class="label__py" aria-hidden="true">{c.py}</small>
            <span class="label__ch">{c.ch}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
