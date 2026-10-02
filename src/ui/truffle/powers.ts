import { powerDef, type PowerId } from '../../fun/powers';

const INK = '#2a2630';

/** Where a power's mark sits: most above the right ear; the heart on the cheek; dash streaks behind. */
function markAt(mark: string): { x: number; y: number; size: number } {
  if (mark === '💗') return { x: 226, y: 150, size: 22 }; // a 💧 on the cheek reads as a tear
  if (mark === '💨') return { x: 72, y: 214, size: 34 };
  return { x: 236, y: 64, size: 34 };
}

/**
 * Power art in Truffle's viewBox (30 20 260 270): tier 1 = the power's mark, tier 2 adds an aura,
 * tier 3 adds a cape behind him and an emblem with the power's character on his chest.
 */
export function powerLayer(id: PowerId, tier: 1 | 2 | 3): { back: string; front: string } {
  const p = powerDef(id)!;
  const m = markAt(p.mark);
  const mark = `<text x="${m.x}" y="${m.y}" font-size="${m.size}" text-anchor="middle" dominant-baseline="middle">${p.mark}</text>`;
  const aura =
    `<circle cx="160" cy="170" r="128" fill="${p.color}" opacity=".18"/>` +
    `<circle cx="160" cy="170" r="112" fill="none" stroke="${p.color}" stroke-width="5" stroke-dasharray="4 14" stroke-linecap="round" opacity=".7"/>`;
  const cape = `<path class="truffle__cape" d="M100 196 C70 232 62 266 76 288 L244 288 C258 266 250 232 220 196 Z" fill="${p.color}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>`;
  const emblem =
    `<circle cx="160" cy="234" r="19" fill="${p.color}" stroke="${INK}" stroke-width="2.6"/>` +
    `<text class="truffle__emblem" x="160" y="235" font-family="WenKai, serif" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="#fffdf7">${p.name}</text>`;
  return {
    back: (tier >= 2 ? aura : '') + (tier === 3 ? cape : ''),
    front: mark + (tier === 3 ? emblem : ''),
  };
}
