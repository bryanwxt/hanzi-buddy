import type { IconName } from '../ui/icons/icons';

export interface RadicalMeaning {
  zh: string;
  en: string;
  icon: IconName; // drawn with the ink icon set
}

const m = (zh: string, en: string, icon: IconName): RadicalMeaning => ({ zh, en, icon });

/** Components a P2/P3 child meets often, with a child-friendly meaning. Variants share a meaning. */
export const RADICALS: Record<string, RadicalMeaning> = {
  '氵': m('水', 'water', 'drop'), '水': m('水', 'water', 'drop'),
  '扌': m('手', 'hand', 'hand'), '手': m('手', 'hand', 'hand'),
  '亻': m('人', 'person', 'person'), '人': m('人', 'person', 'person'),
  '口': m('口', 'mouth', 'mouth'),
  '木': m('木', 'tree', 'tree'),
  '日': m('日', 'sun', 'sun'),
  '月': m('月', 'moon / body', 'moon'),
  '女': m('女', 'girl', 'girl'),
  '讠': m('言', 'speech', 'speech'), '言': m('言', 'speech', 'speech'),
  '艹': m('草', 'grass', 'grass'),
  '辶': m('走', 'walk', 'walk'), '走': m('走', 'walk', 'walk'),
  '忄': m('心', 'heart', 'heart'), '心': m('心', 'heart', 'heart'),
  '土': m('土', 'earth', 'earth'),
  '火': m('火', 'fire', 'flame'), '灬': m('火', 'fire', 'flame'),
  '钅': m('金', 'metal', 'metal'), '金': m('金', 'metal', 'metal'),
  '纟': m('丝', 'thread', 'thread'),
  '宀': m('房', 'roof', 'roof'),
  '目': m('目', 'eye', 'eye'),
  '米': m('米', 'rice', 'rice'),
  '禾': m('禾', 'grain', 'grain'),
  '竹': m('竹', 'bamboo', 'bamboo'), '⺮': m('竹', 'bamboo', 'bamboo'),
  '犭': m('犬', 'animal', 'animal'),
  '虫': m('虫', 'insect', 'insect'),
  '鸟': m('鸟', 'bird', 'bird'),
  '雨': m('雨', 'rain', 'rain'),
  '门': m('门', 'door', 'door'),
  '衤': m('衣', 'clothes', 'clothes'), '衣': m('衣', 'clothes', 'clothes'),
  '饣': m('饭', 'food', 'food'),
  '疒': m('病', 'sickness', 'sick'),
  '王': m('玉', 'jade', 'jade'),
  '石': m('石', 'stone', 'rock'),
  '贝': m('贝', 'money', 'money'),
  '车': m('车', 'vehicle', 'car'),
  '力': m('力', 'strength', 'strength'),
  '刂': m('刀', 'knife', 'knife'),
  '冫': m('冰', 'ice', 'ice'),
  '足': m('足', 'foot', 'foot'), '⻊': m('足', 'foot', 'foot'),
  '马': m('马', 'horse', 'horse'),
  '山': m('山', 'mountain', 'mountain'),
  '田': m('田', 'field', 'field'),
  '页': m('头', 'head', 'head'),
  '阝': m('阝', 'hill / town', 'town'),
  '广': m('广', 'shelter', 'shelter'),
};

export function radicalMeaning(component: string): RadicalMeaning | undefined {
  return RADICALS[component];
}
