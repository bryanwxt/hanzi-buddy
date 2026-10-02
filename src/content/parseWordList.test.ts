import { describe, expect, it } from 'vitest';
import { makeWord } from '../test/fixtures';
import { makeParentWords, parseWordList } from './parseWordList';

describe('parseWordList', () => {
  it('reads one word per line, ignoring blanks, spaces and numbering', () => {
    expect(parseWordList('1. 大人\n\n 朋 友 \n3、学校').words.map((w) => w.text)).toEqual(['大人', '朋友', '学校']);
  });
  it('skips repeats within the same paste', () => {
    expect(parseWordList('大人\n大人').words).toHaveLength(1);
  });
  it('rejects non-Chinese lines and words longer than 4 characters', () => {
    const r = parseWordList('hello\n我们是好朋友\n你好');
    expect(r.words.map((w) => w.text)).toEqual(['你好']);
    expect(r.rejected).toEqual(['hello', '我们是好朋友']);
  });
  it('gives pinyin that follows the word context', () => {
    expect(parseWordList('长大\n银行').words.map((w) => w.pinyin)).toEqual(['zhǎng dà', 'yín háng']);
  });
});

describe('makeParentWords', () => {
  const parsed = [
    { text: '朋友', pinyin: 'péng you' },
    { text: '大', pinyin: 'dà' },
    { text: '学校', pinyin: 'xué xiào' },
  ];
  const existing = [
    makeWord('大', { rank: 5, writeable: false }),
    makeWord('学校', { id: 'p:old', source: 'parent', rank: null, level: null, listName: '听写 1', listedAt: 1 }),
  ];
  const r = makeParentWords(parsed, { listName: '听写 2', writeable: true, existing, now: 1000, newId: () => 'n1' });

  it('adds new words as parent words in paste order', () => {
    expect(r.added).toEqual([
      expect.objectContaining({ id: 'p:n1', text: '朋友', pinyin: 'péng you', source: 'parent', listName: '听写 2', listedAt: 1000, writeable: true, paused: false }),
    ]);
  });
  it('pulls matching built-in words to the front instead of duplicating them', () => {
    expect(r.promoted).toEqual([expect.objectContaining({ id: 'b:大', listName: '听写 2', listedAt: 1001, writeable: true })]);
  });
  it('reports words already in an earlier list', () => {
    expect(r.duplicates).toEqual(['学校']);
  });
});
