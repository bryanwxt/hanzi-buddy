import { describe, expect, it } from 'vitest';
import { BUILTIN, builtinWords, getCharInfo, hanChars, wordComponents } from './index';
import { radicalMeaning } from './radicals';

describe('content module', () => {
  it('maps every built-in character to an active built-in word', () => {
    const words = builtinWords(123);
    expect(words).toHaveLength(600);
    expect(words[0]).toMatchObject({ id: `b:${BUILTIN[0]!.char}`, source: 'builtin', paused: false, createdAt: 123, rank: 0 });
  });
  it('knows the components of 河', () => {
    expect(getCharInfo('河')?.components).toContain('氵');
  });
  it('hanChars ignores punctuation and letters', () => {
    expect(hanChars('我，ok 你！')).toEqual(['我', '你']);
  });
  it('wordComponents unions radicals and components of each character', () => {
    expect(wordComponents('汉河')).toEqual(expect.arrayContaining(['氵', '又', '可']));
  });
  it('explains common radicals for children', () => {
    expect(radicalMeaning('氵')).toEqual({ zh: '水', en: 'water', icon: 'drop' });
  });
});
