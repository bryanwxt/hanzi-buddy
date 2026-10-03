import { describe, expect, it } from 'vitest';
import { SCENE_IDS } from '../ui/kantu/art';
import { afterStory, nextSpeaking, sceneFor, showStarters } from './flow';
import { SCENES_KT, STORY_PARTS } from './scenes';
import { render } from '@testing-library/preact';
import { Label } from '../ui/Label';

const CHILD_TEXT = /^[\p{Script=Han}，。！？：“”…、]+$/u;

describe('看图说话 content', () => {
  it('has the eight scenes in art order, each complete', () => {
    expect(SCENES_KT.map((s) => s.id)).toEqual(SCENE_IDS);
    for (const s of SCENES_KT) {
      expect(s.words).toHaveLength(5);
      for (const p of STORY_PARTS) expect(s.model[p.part].length).toBeGreaterThan(5);
      expect(s.questions.length).toBeGreaterThanOrEqual(2);
      expect(s.questions.length).toBeLessThanOrEqual(3);
    }
  });
  it('every child-facing string is Chinese characters and punctuation', () => {
    for (const p of STORY_PARTS) for (const t of [p.question, p.starter]) expect(t).toMatch(CHILD_TEXT);
    for (const s of SCENES_KT) {
      for (const t of [s.title, ...s.words, ...Object.values(s.model), ...s.questions.flatMap((q) => [q.q, q.starter, q.answer])]) expect(t).toMatch(CHILD_TEXT);
    }
  });
  it('the five parts and their starters, in order', () => {
    expect(STORY_PARTS.map((p) => [p.part, p.question, p.starter])).toEqual([
      ['opening', '图上画的是什么？', '图上画的是…'],
      ['setting', '什么时候？在哪里？有谁？', '有一天，…在…'],
      ['events', '发生了什么事？', '突然，…'],
      ['ending', '后来怎么样了？', '后来，…'],
      ['opinion', '你觉得怎么样？为什么？', '我觉得…，因为…'],
    ]);
  });
});

describe('看图说话 flow', () => {
  it('alternates with 朗读, starting with a story, and fills in when 朗读 has nothing', () => {
    expect(nextSpeaking(null, true)).toBe('story');
    expect(nextSpeaking('story', true)).toBe('langdu');
    expect(nextSpeaking('langdu', true)).toBe('story');
    expect(nextSpeaking('story', false)).toBe('story');
  });
  it('goes through the scenes in order and counts stories told', () => {
    expect(sceneFor({ next: 9 }).id).toBe('wallet');
    expect(afterStory({ next: 7, told: 3 })).toEqual({ next: 8, told: 4 });
  });
  it('shows starters for the first 8 stories', () => {
    expect(showStarters(7)).toBe(true);
    expect(showStarters(8)).toBe(false);
  });
});

describe('看图说话 content quality', () => {
  const story = (sc: (typeof SCENES_KT)[number]) => STORY_PARTS.map((p) => sc.model[p.part]).join('');
  it('every theme word is used in its model story', () => {
    for (const sc of SCENES_KT) for (const w of sc.words) expect(story(sc), `${sc.id}: ${w}`).toContain(w);
  });
  it('打翻 always takes what was knocked over (打翻了花瓶), never "…打翻了。" or "打翻在"', () => {
    for (const sc of SCENES_KT) expect(story(sc)).not.toMatch(/打翻了。|打翻在/);
  });
  const py = (zh: string) => render(<Label zh={zh} />).container.querySelector('.label')!.getAttribute('data-py')!;
  it('pinyin above the stories reads them right: 还给 huán, 得/地 as de, 了 as le', () => {
    expect(py('还给')).toBe('huán gěi');
    expect(py('别人的东西要还给别人。')).toContain('huán gěi');
    expect(py('他做错了事')).toContain('cuò le');
    expect(py('小红做得很对')).toContain('zuò de');
    expect(py('他走得太快')).toContain('zǒu de');
    expect(py('小心地走过马路')).toContain('xiǎo xīn de');
    expect(py('不好意思地走了')).toContain('yì si de');
    expect(py('有礼貌地请他')).toContain('lǐ mào de');
    expect(py('心地善良')).toBe('xīn dì shàn liáng'); // overrides stay narrow
    for (const sc of SCENES_KT) for (const t of [...Object.values(sc.model), ...sc.questions.flatMap((q) => [q.q, q.answer])]) {
      expect(py(t), t).not.toMatch(/liǎo|hái gěi| dé /);
    }
  });
});
