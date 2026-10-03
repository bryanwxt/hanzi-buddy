import { describe, expect, it } from 'vitest';
import { makeWord } from '../../test/fixtures';
import { writingCue } from './cue';

describe('writingCue', () => {
  it('gives the first meaning, a blanked word that uses it, and says which character', () => {
    const er = makeWord('儿', { meaning: 'son, child', examples: [{ text: '儿子', pinyin: 'ér zi' }, { text: '好玩儿', pinyin: 'hǎo wán ér' }] });
    expect(writingCue(er)).toEqual({ meaning: 'son', blanked: '＿子', blankedPy: 'zi', speech: '儿，儿子的儿' });
  });
  it('without an example word there is no blank, and it just says the character', () => {
    const ba = makeWord('八', { meaning: 'eight; 8', examples: [] });
    expect(writingCue(ba)).toEqual({ meaning: 'eight', blanked: null, blankedPy: null, speech: '八' });
  });
  it('a parent word with no meaning says the word itself', () => {
    expect(writingCue(makeWord('大人', { source: 'parent' }))).toEqual({ meaning: null, blanked: null, blankedPy: null, speech: '大人' });
  });
  it('ignores an example that is just the character itself', () => {
    expect(writingCue(makeWord('大', { meaning: 'big', examples: [{ text: '大', pinyin: 'dà' }] })).blanked).toBeNull();
  });
});
