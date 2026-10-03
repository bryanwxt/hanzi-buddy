import { customPinyin } from 'pinyin-pro';

/**
 * Readings pinyin-pro gets wrong in the app's own sentences. Exact phrases only: a broad rule like 心地 → xīn de
 * would break 心地善良 (xīn dì).
 */
customPinyin({
  还给: 'huán gěi',
  做得: 'zuò de',
  走得: 'zǒu de',
  做错了: 'zuò cuò le',
  小心地: 'xiǎo xīn de',
  不好意思地: 'bù hǎo yì si de',
  有礼貌地: 'yǒu lǐ mào de',
});
