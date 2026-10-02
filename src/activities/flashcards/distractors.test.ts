import { describe, expect, it } from 'vitest';
import { builtinWords } from '../../content';
import { mulberry32 } from '../../lib/random';
import { makeWord } from '../../test/fixtures';
import { pickCharacterDistractors, pickPinyinDistractors, syllableTone, toneless, withTone } from './distractors';

const all = builtinWords(0);
const w = (t: string) => all.find((x) => x.text === t)!;

describe('pinyin helpers', () => {
  it('strips tones but keeps ü', () => {
    expect(toneless('hé')).toBe('he');
    expect(toneless('péng you')).toBe('peng you');
    expect(toneless('lǜ')).toBe('lü');
  });
  it('splits a syllable into base and tone', () => {
    expect(syllableTone('lǜ')).toEqual({ base: 'lü', tone: 4 });
    expect(syllableTone('de')).toEqual({ base: 'de', tone: 5 });
  });
  it('places tone marks by the standard rules', () => {
    const bases = ['hao', 'gou', 'gui', 'liu', 'xie', 'lü'];
    const tones = [3, 1, 4, 4, 2, 4];
    expect(bases.map((b, i) => withTone(b, tones[i]!))).toEqual(['hǎo', 'gōu', 'guì', 'liù', 'xié', 'lǜ']);
  });
});

describe('pickCharacterDistractors', () => {
  it('prefers look-alikes and never offers a sound-alike', () => {
    const pool = ['喝', '汉', '洗', '汽', '大', '人', '口', '他'].map(w);
    const picked = pickCharacterDistractors(w('河'), pool, mulberry32(3)).map((x) => x.text);
    expect([...picked].sort()).toEqual(['汉', '汽', '洗'].sort());
  });
  it('only offers options of the same length, and fewer when the pool is small', () => {
    const target = makeWord('大人', { id: 'p:1', pinyin: 'dà rén', source: 'parent', level: null, rank: null });
    const pool = [w('大'), w('人'), makeWord('朋友', { id: 'p:2', pinyin: 'péng you', level: null, rank: null })];
    expect(pickCharacterDistractors(target, pool, mulberry32(1)).map((x) => x.text)).toEqual(['朋友']);
  });
  it('never returns the target or duplicates', () => {
    expect(pickCharacterDistractors(w('河'), [w('河'), w('河'), w('汉'), w('汉')], mulberry32(1)).map((x) => x.text)).toEqual(['汉']);
  });
});

describe('pickPinyinDistractors', () => {
  it('returns three distinct wrong options including a tone change', () => {
    const opts = pickPinyinDistractors(w('河'), all, mulberry32(5));
    expect(opts).toHaveLength(3);
    expect(new Set(opts).size).toBe(3);
    expect(opts).not.toContain('hé');
    expect(opts.some((o) => ['hē', 'hě', 'hè'].includes(o))).toBe(true);
  });
  it('still gives three options for a two-syllable word with an empty pool', () => {
    const opts = pickPinyinDistractors(makeWord('朋友', { pinyin: 'péng you' }), [], mulberry32(2));
    expect(opts).toHaveLength(3);
    expect(opts.every((o) => o.split(' ').length === 2 && o !== 'péng you')).toBe(true);
  });
});
