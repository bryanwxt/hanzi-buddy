export type AccessorySlot = 'face' | 'neck' | 'held' | 'back';

export interface AccessoryDef {
  id: string;
  zh: string;
  py: string;
  slot: AccessorySlot;
}

const a = (id: string, zh: string, py: string, slot: AccessorySlot): AccessoryDef => ({ id, zh, py, slot });

/** Add-ons that go with any onesie or outfit (each costume brings its own hat). */
export const ACCESSORY_DEFS: AccessoryDef[] = [
  a('sunglasses', '墨镜', 'mòjìng', 'face'),
  a('starglasses', '星星眼镜', 'xīngxing yǎnjìng', 'face'),
  a('heartglasses', '爱心眼镜', 'àixīn yǎnjìng', 'face'),
  a('moustache', '小胡子', 'xiǎo húzi', 'face'),
  a('scarf', '围巾', 'wéijīn', 'neck'),
  a('bowtie', '领结', 'lǐngjié', 'neck'),
  a('medal', '金牌', 'jīnpái', 'neck'),
  a('headphones', '耳机', 'ěrjī', 'neck'),
  a('brush', '毛笔', 'máobǐ', 'held'),
  a('lantern', '红灯笼', 'hóng dēnglong', 'held'),
  a('kite', '风筝', 'fēngzheng', 'held'),
  a('balloon', '气球', 'qìqiú', 'held'),
  a('wand', '魔法棒', 'mófǎbàng', 'held'),
  a('backpack', '书包', 'shūbāo', 'back'),
  a('wings', '翅膀', 'chìbǎng', 'back'),
  a('jetpack', '喷气背包', 'pēnqì bēibāo', 'back'),
];

export const ACCESSORY_IDS: string[] = ACCESSORY_DEFS.map((d) => d.id);

/** The dragon-era emoji accessories, one-to-one onto the new ones, so nothing earned is lost. */
export const LEGACY_ACCESSORY: Record<string, string> = {
  '🎩': 'moustache', '👑': 'medal', '🕶️': 'sunglasses', '🎀': 'bowtie',
  '🧢': 'backpack', '🎓': 'brush', '⛑️': 'jetpack', '🌸': 'heartglasses',
  '⭐': 'starglasses', '🎈': 'balloon', '🍀': 'lantern', '🦋': 'wings',
  '🌈': 'wand', '🎧': 'headphones', '🧣': 'scarf', '🪁': 'kite',
};

export const accessoryById = (id: string | null | undefined): AccessoryDef | undefined => ACCESSORY_DEFS.find((d) => d.id === id);

export function migrateAccessory(v: string | null | undefined): string | null {
  if (!v) return null;
  if (accessoryById(v)) return v;
  return LEGACY_ACCESSORY[v] ?? null;
}
