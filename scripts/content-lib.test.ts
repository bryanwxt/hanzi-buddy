import { describe, expect, it } from 'vitest';
import { buildBuiltin, cleanHskWord, extractComponents, firstSenses, parseHskSections, type MmahEntry } from './content-lib';

const charlist = '# header\n\n一级汉字表\n1\t大\n2\t河\n3\t人\n\n二级汉字表\n1\t可\n2\t人\n\n初等手写字表\n1\t大\n2\t人\n';
const wordlist = '# header\n\n一级词汇表\n1 大人\n2 爸爸｜爸\n\n二级词汇表\n1 大河（名）\n\n三级词汇表\n1 可人\n';

function entry(character: string, strokes: number, decomposition: string, radical: string): MmahEntry {
  return { character, definition: `def of ${character}; more; extra`, pinyin: [], decomposition, radical, matches: Array(strokes).fill(null) };
}
const dictionary = new Map<string, MmahEntry>([
  ['大', entry('大', 3, '？', '大')],
  ['河', entry('河', 8, '⿰氵可', '氵')],
  ['人', entry('人', 2, '？', '人')],
  ['可', entry('可', 5, '⿹丁口', '口')],
]);
const pinyinOf = (t: string) => [...t].map((c) => `py(${c})`).join(' ');

describe('parseHskSections', () => {
  it('groups numbered entries under their section headers', () => {
    const s = parseHskSections(charlist);
    expect(s.get('一级汉字表')).toEqual(['大', '河', '人']);
    expect(s.get('初等手写字表')).toEqual(['大', '人']);
    expect(parseHskSections(wordlist).get('一级词汇表')).toEqual(['大人', '爸爸｜爸']);
  });
});

describe('cleanHskWord', () => {
  it('keeps the first variant and drops part-of-speech notes', () => {
    expect(cleanHskWord('爸爸｜爸')).toBe('爸爸');
    expect(cleanHskWord('大河（名）')).toBe('大河');
  });
});

describe('extractComponents', () => {
  it('drops structure symbols, unknown markers and duplicates', () => {
    expect(extractComponents('⿰氵可')).toEqual(['氵', '可']);
    expect(extractComponents('？')).toEqual([]);
    expect(extractComponents('⿱口口')).toEqual(['口']);
  });
});

describe('firstSenses', () => {
  it('keeps the first two senses', () => {
    expect(firstSenses('river, stream; the Yellow river')).toBe('river, stream');
    expect(firstSenses(undefined)).toBe('');
  });
});

describe('buildBuiltin', () => {
  const chars = buildBuiltin({ hskChars: parseHskSections(charlist), hskWords: parseHskSections(wordlist), dictionary, pinyinOf });

  it('orders by HSK level then stroke count, skipping repeats', () => {
    expect(chars.map((c) => c.char)).toEqual(['人', '大', '河', '可']);
    expect(chars.map((c) => c.rank)).toEqual([0, 1, 2, 3]);
  });
  it('marks handwriting-list characters as writeable', () => {
    expect(chars.filter((c) => c.writeable).map((c) => c.char)).toEqual(['人', '大']);
  });
  it('picks up to two example words made of same-or-lower-level characters', () => {
    const da = chars.find((c) => c.char === '大')!;
    expect(da.examples.map((e) => e.text)).toEqual(['大人', '大河']);
    expect(da.examples[0]!.pinyin).toBe('py(大) py(人)');
  });
  it('carries radical, components, strokes and meaning', () => {
    expect(chars.find((c) => c.char === '河')).toMatchObject({
      radical: '氵', components: ['氵', '可'], strokes: 8, meaning: 'def of 河, more', level: 1,
    });
  });
});
