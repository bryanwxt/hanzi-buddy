import { describe, expect, it } from 'vitest';
import { displayText, splitPhrases } from './phrases';
describe('phrases', () => {
  it('splits after Chinese punctuation and at parent / marks', () => {
    expect(splitPhrases('我家有五个人：爸爸、妈妈和我。爸爸是医生，妈妈是老师。')).toEqual(['我家有五个人：', '爸爸、', '妈妈和我。', '爸爸是医生，', '妈妈是老师。']);
    expect(splitPhrases('今天天气很好 / 我们去公园玩。')).toEqual(['今天天气很好', '我们去公园玩。']);
    expect(splitPhrases('  ')).toEqual([]);
    expect(displayText('今天天气很好 / 我们去公园玩。')).toBe('今天天气很好我们去公园玩。');
  });
});
