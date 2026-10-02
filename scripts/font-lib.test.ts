import { describe, expect, it } from 'vitest';
import { collectFontText, EXTRA_GLYPHS } from './font-lib';

describe('collectFontText', () => {
  it('keeps unique Han characters plus punctuation and digits, sorted', () => {
    const text = collectFontText(['你好 hello', '好，学']);
    expect([...text].filter((c) => /\p{Script=Han}/u.test(c))).toEqual(['你', '好', '学'].sort());
    expect(text).not.toContain('h');
    for (const g of EXTRA_GLYPHS) expect(text).toContain(g);
    expect(new Set(text).size).toBe([...text].length);
  });
});
