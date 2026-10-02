export const EXTRA_GLYPHS = '，。！？：；“”‘’、（）《》…—·0123456789';

/** Every Han character in the sources plus common CJK punctuation and digits, unique and sorted. */
export function collectFontText(sources: string[]): string {
  const set = new Set<string>();
  for (const s of sources) for (const ch of s) if (/\p{Script=Han}/u.test(ch)) set.add(ch);
  for (const ch of EXTRA_GLYPHS) set.add(ch);
  return [...set].sort().join('');
}
