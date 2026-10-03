import type { SceneId } from '../ui/kantu/art';

/** The five parts of a 看图说话 story (spec §17). */
export type StoryPart = 'opening' | 'setting' | 'events' | 'ending' | 'opinion';

export const STORY_PARTS: { part: StoryPart; question: string; starter: string }[] = [
  { part: 'opening', question: '图上画的是什么？', starter: '图上画的是…' },
  { part: 'setting', question: '什么时候？在哪里？有谁？', starter: '有一天，…在…' },
  { part: 'events', question: '发生了什么事？', starter: '突然，…' },
  { part: 'ending', question: '后来怎么样了？', starter: '后来，…' },
  { part: 'opinion', question: '你觉得怎么样？为什么？', starter: '我觉得…，因为…' },
];

export interface Scene {
  id: SceneId;
  title: string;
  words: string[];
  model: Record<StoryPart, string>;
  questions: { q: string; starter: string; answer: string }[];
}

/** The eight built-in scenes, each on a common P2 oral-exam theme, with a model story and Truffle's questions. */
export const SCENES_KT: Scene[] = [
  {
    id: 'vase',
    title: '打翻花瓶',
    words: ['打翻', '花瓶', '诚实', '道歉', '老板'],
    model: {
      opening: '图上画的是一个小男孩在商店里打翻了花瓶。',
      setting: '有一天下午，小明和妈妈在商店里买东西。',
      events: '突然，小明不小心打翻了桌上的花瓶，花瓶掉在地上，摔破了。',
      ending: '后来，小明马上向老板道歉，说：“对不起，是我打翻的。”老板说：“没关系，你很诚实。”',
      opinion: '我觉得小明是一个诚实的孩子，因为他做错了事敢承认。',
    },
    questions: [
      { q: '如果你是小明，你会怎么做？为什么？', starter: '我会…，因为…', answer: '我会马上向老板道歉，因为做错了事要诚实。' },
      { q: '你有没有不小心打翻过东西？', starter: '有一次，我…', answer: '有一次，我打翻了水杯，我马上告诉妈妈，还把桌子擦干净了。' },
    ],
  },
  {
    id: 'wallet',
    title: '捡到钱包',
    words: ['捡到', '钱包', '还给', '失主', '谢谢'],
    model: {
      opening: '图上画的是一个小女孩在公园里捡到了一个钱包。',
      setting: '星期六早上，小红在公园里散步。',
      events: '突然，她看见地上有一个钱包。',
      ending: '后来，小红把钱包还给了失主。失主很高兴，对她说：“谢谢你！”',
      opinion: '我觉得小红做得很对，因为别人的东西要还给别人。',
    },
    questions: [
      { q: '如果你捡到钱包，你会怎么做？', starter: '我会…，因为…', answer: '我会把钱包交给警察，因为失主一定很着急。' },
      { q: '为什么我们要把东西还给失主？', starter: '我觉得…，因为…', answer: '我觉得要还给失主，因为丢了东西的人会很难过。' },
    ],
  },
  {
    id: 'grandma',
    title: '帮助老奶奶',
    words: ['帮助', '老奶奶', '过马路', '小心', '红绿灯'],
    model: {
      opening: '图上画的是两个小学生帮助老奶奶过马路。',
      setting: '有一天放学后，小明和小华走在回家的路上。',
      events: '他们看见一位老奶奶提着很重的东西，站在马路边，不敢过马路。',
      ending: '后来，他们扶着老奶奶，看着红绿灯，等绿灯亮了，小心地走过马路。老奶奶笑着说：“你们真是好孩子！”',
      opinion: '我觉得他们很有爱心，因为他们主动帮助别人。',
    },
    questions: [
      { q: '你帮助过别人吗？你做了什么？', starter: '我…', answer: '我帮奶奶拿过东西，她很开心。' },
      { q: '过马路的时候，我们要注意什么？', starter: '我们要…', answer: '我们要看红绿灯，绿灯亮了才走。' },
    ],
  },
  {
    id: 'queue',
    title: '排队',
    words: ['排队', '插队', '食堂', '等一等', '不对'],
    model: {
      opening: '图上画的是同学们在食堂排队买东西。',
      setting: '有一天休息的时候，很多同学在学校食堂排队。',
      events: '突然，一个男孩跑过来，插队站到了前面。',
      ending: '后来，小华对他说：“请你等一等，到后面排队。”男孩不好意思地走到了后面。',
      opinion: '我觉得插队是不对的，因为大家都在等。',
    },
    questions: [
      { q: '如果有人插队，你会怎么做？', starter: '我会…，因为…', answer: '我会有礼貌地请他到后面排队，因为排队才公平。' },
      { q: '为什么我们要排队？', starter: '我觉得…，因为…', answer: '我觉得要排队，因为这样大家都不会乱。' },
    ],
  },
  {
    id: 'litter',
    title: '乱丢垃圾',
    words: ['垃圾', '乱丢', '捡起来', '垃圾桶', '公园'],
    model: {
      opening: '图上画的是一个孩子在公园里乱丢垃圾。',
      setting: '星期天下午，很多人在公园里玩。',
      events: '一个男孩吃完饼干，把包装纸乱丢在地上。',
      ending: '后来，一个女孩把垃圾捡起来，丢进了垃圾桶。男孩看见了，很不好意思。',
      opinion: '我觉得我们不应该乱丢垃圾，因为公园是大家的。',
    },
    questions: [
      { q: '如果你看见有人乱丢垃圾，你会说什么？', starter: '我会说…', answer: '我会说：“请你把垃圾丢进垃圾桶。”' },
      { q: '你怎样保持公园干净？', starter: '我会…', answer: '我会把垃圾丢进垃圾桶。' },
    ],
  },
  {
    id: 'share',
    title: '分享午饭',
    words: ['分享', '午饭', '忘了', '一起', '开心'],
    model: {
      opening: '图上画的是两个同学在一起吃午饭。',
      setting: '有一天中午，同学们在教室里吃午饭。',
      events: '小明发现小华忘了带午饭，她很饿，也很难过。',
      ending: '后来，小明把自己的面包分一半给小华。两个人一起吃，都很开心。',
      opinion: '我觉得小明很好，因为他愿意和朋友分享。',
    },
    questions: [
      { q: '你和别人分享过什么？', starter: '我和…分享过…', answer: '我和弟弟分享过我的玩具。' },
      { q: '如果你的朋友忘了带东西，你会怎么做？', starter: '我会…，因为…', answer: '我会借给他，因为朋友要互相帮助。' },
    ],
  },
  {
    id: 'fall',
    title: '跌倒了',
    words: ['跌倒', '受伤', '扶起来', '医务室', '关心'],
    model: {
      opening: '图上画的是一个小朋友在操场上跌倒了。',
      setting: '有一天上体育课，同学们在操场上跑步。',
      events: '突然，小华跌倒了，膝盖受伤了，他哭了起来。',
      ending: '后来，小明马上把他扶起来，送他去医务室。',
      opinion: '我觉得小明很关心同学，因为他马上帮助受伤的朋友。',
    },
    questions: [
      { q: '如果你的同学跌倒了，你会怎么做？', starter: '我会…，因为…', answer: '我会把他扶起来，送他去医务室，因为他受伤了。' },
      { q: '在操场上玩的时候，我们要注意什么？', starter: '我们要…', answer: '我们要小心，不要推别人。' },
    ],
  },
  {
    id: 'spill',
    title: '撞到人',
    words: ['撞到', '打翻', '饮料', '对不起', '没关系'],
    model: {
      opening: '图上画的是一个小男孩撞到了别人，打翻了饮料。',
      setting: '有一天在食堂，小明拿着饮料走回座位。',
      events: '他走得太快，撞到了小红，打翻了饮料，饮料洒在小红的衣服上。',
      ending: '后来，小明马上说：“对不起！”还帮小红擦衣服。小红说：“没关系。”',
      opinion: '我觉得小明做得很好，因为他做错了事会马上道歉。',
    },
    questions: [
      { q: '如果你撞到了别人，你会说什么？', starter: '我会说…', answer: '我会说：“对不起，你没事吧？”' },
      { q: '别人向你道歉的时候，你会怎么说？', starter: '我会说…', answer: '我会说：“没关系。”' },
    ],
  },
];
