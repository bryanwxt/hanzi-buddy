const BREAK = /([，。！？；：、])/;
export function displayText(text: string): string {
  return text.replace(/\s*\/\s*/g, '');
}
/** Read-aloud phrases: split after Chinese punctuation (kept on the left) and at the parent's '/' marks. */
export function splitPhrases(text: string): string[] {
  const out: string[] = [];
  for (const chunk of text.split('/')) {
    let cur = '';
    for (const part of chunk.split(BREAK)) {
      if (!part) continue;
      cur += part;
      if (BREAK.test(part)) { out.push(cur.trim()); cur = ''; }
    }
    if (cur.trim()) out.push(cur.trim());
  }
  return out.filter(Boolean);
}
