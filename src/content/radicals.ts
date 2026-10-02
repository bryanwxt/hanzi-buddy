export interface RadicalMeaning {
  zh: string;
  en: string;
  emoji: string;
}

const m = (zh: string, en: string, emoji: string): RadicalMeaning => ({ zh, en, emoji });

/** Components a P2/P3 child meets often, with a child-friendly meaning. Variants share a meaning. */
export const RADICALS: Record<string, RadicalMeaning> = {
  '氵': m('水', 'water', '💧'), '水': m('水', 'water', '💧'),
  '扌': m('手', 'hand', '✋'), '手': m('手', 'hand', '✋'),
  '亻': m('人', 'person', '🧍'), '人': m('人', 'person', '🧍'),
  '口': m('口', 'mouth', '👄'),
  '木': m('木', 'tree', '🌳'),
  '日': m('日', 'sun', '☀️'),
  '月': m('月', 'moon / body', '🌙'),
  '女': m('女', 'girl', '👧'),
  '讠': m('言', 'speech', '💬'), '言': m('言', 'speech', '💬'),
  '艹': m('草', 'grass', '🌿'),
  '辶': m('走', 'walk', '🚶'), '走': m('走', 'walk', '🚶'),
  '忄': m('心', 'heart', '❤️'), '心': m('心', 'heart', '❤️'),
  '土': m('土', 'earth', '🟫'),
  '火': m('火', 'fire', '🔥'), '灬': m('火', 'fire', '🔥'),
  '钅': m('金', 'metal', '🔩'),
  '纟': m('丝', 'thread', '🧵'),
  '宀': m('房', 'roof', '🏠'),
  '目': m('目', 'eye', '👁️'),
  '米': m('米', 'rice', '🍚'),
  '禾': m('禾', 'grain', '🌾'),
  '竹': m('竹', 'bamboo', '🎋'), '⺮': m('竹', 'bamboo', '🎋'),
  '犭': m('犬', 'animal', '🐕'),
  '虫': m('虫', 'insect', '🐛'),
  '鸟': m('鸟', 'bird', '🐦'),
  '雨': m('雨', 'rain', '🌧️'),
  '门': m('门', 'door', '🚪'),
  '衤': m('衣', 'clothes', '👕'), '衣': m('衣', 'clothes', '👕'),
  '饣': m('饭', 'food', '🍜'),
  '疒': m('病', 'sickness', '🤒'),
  '王': m('玉', 'jade', '💎'),
  '石': m('石', 'stone', '🪨'),
  '贝': m('贝', 'money', '💰'),
  '车': m('车', 'vehicle', '🚗'),
  '力': m('力', 'strength', '💪'),
  '刂': m('刀', 'knife', '🔪'),
  '冫': m('冰', 'ice', '🧊'),
  '足': m('足', 'foot', '🦶'), '⻊': m('足', 'foot', '🦶'),
  '马': m('马', 'horse', '🐎'),
  '山': m('山', 'mountain', '⛰️'),
  '田': m('田', 'field', '🟩'),
  '页': m('头', 'head', '🙂'),
  '阝': m('阝', 'hill / town', '🏘️'),
  '广': m('广', 'shelter', '🛖'),
};

export function radicalMeaning(component: string): RadicalMeaning | undefined {
  return RADICALS[component];
}
