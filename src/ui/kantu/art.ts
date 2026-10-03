/* Ink art for the eight 看图说话 scenes (spec §17). 360×270 canvas; §13 ink rules: outline #2a2630,
 * flat fills, no gradients or filters. Simple ink children, never anyone's characters. */

export type SceneId = 'vase' | 'wallet' | 'grandma' | 'queue' | 'litter' | 'share' | 'fall' | 'spill';
export const SCENE_IDS: SceneId[] = ['vase', 'wallet', 'grandma', 'queue', 'litter', 'share', 'fall', 'spill'];
export const SCENE_VIEW = '0 0 360 270';

const INK = '#2a2630';
const SKIN = '#ffe0cc';
const S = `stroke="${INK}" stroke-linecap="round" stroke-linejoin="round"`;

type Pt = [number, number];
type Hair = 'boy' | 'girl' | 'grey' | 'man' | 'none';
type Mood = 'happy' | 'oops' | 'sad' | 'calm' | 'cry';

interface Person {
  x: number; // between the feet
  y: number; // ground line
  h?: number; // height (default 76 for a child)
  shirt: string;
  pants?: string;
  skirt?: boolean;
  hair?: Hair;
  hairColor?: string;
  mood?: Mood;
  look?: -1 | 0 | 1; // eyes glance left / ahead / right
  armL?: Pt; // hand offsets from the left shoulder
  armR?: Pt;
  legL?: Pt; // foot offsets from the hip
  legR?: Pt;
  apron?: boolean;
  stick?: boolean; // walking stick in the right hand
}

/** A simple ink person: round head, dot eyes, a shirt, arms and legs as thick ink strokes. */
function person(p: Person): string {
  const h = p.h ?? 76;
  const k = h / 76;
  const headR = 13 * k;
  const hipY = p.y - 26 * k;
  const shoulderY = p.y - 50 * k;
  const headY = shoulderY - headR - 2 * k;
  const sw = 3 * Math.max(0.8, k);
  const limb = (from: Pt, off: Pt, color: string) =>
    `<path d="M${from[0]} ${from[1]} l${off[0] * k} ${off[1] * k}" stroke="${color}" stroke-width="${7 * k}" stroke-linecap="round"/>`;
  const legL = p.legL ?? [-6, 26];
  const legR = p.legR ?? [6, 26];
  const armL = p.armL ?? [-10, 22];
  const armR = p.armR ?? [10, 22];
  const shL: Pt = [p.x - 10 * k, shoulderY + 4 * k];
  const shR: Pt = [p.x + 10 * k, shoulderY + 4 * k];
  const hip: Pt = [p.x, hipY];
  const legs =
    limb([hip[0] - 4 * k, hip[1]], legL, p.pants ?? INK) +
    limb([hip[0] + 4 * k, hip[1]], legR, p.pants ?? INK) +
    `<g ${S} stroke-width="${sw}" fill="none"><path d="M${hip[0] - 4 * k} ${hip[1]} l${legL[0] * k} ${legL[1] * k} M${hip[0] + 4 * k} ${hip[1]} l${legR[0] * k} ${legR[1] * k}"/></g>` +
    `<g fill="${INK}"><ellipse cx="${hip[0] - 4 * k + legL[0] * k}" cy="${hip[1] + legL[1] * k}" rx="${4.5 * k}" ry="${2.6 * k}"/><ellipse cx="${hip[0] + 4 * k + legR[0] * k}" cy="${hip[1] + legR[1] * k}" rx="${4.5 * k}" ry="${2.6 * k}"/></g>`;
  const body = p.skirt
    ? `<path d="M${p.x - 11 * k} ${shoulderY} L${p.x + 11 * k} ${shoulderY} L${p.x + 17 * k} ${hipY + 4 * k} L${p.x - 17 * k} ${hipY + 4 * k}Z" fill="${p.shirt}" ${S} stroke-width="${sw}"/>`
    : `<path d="M${p.x - 12 * k} ${shoulderY} L${p.x + 12 * k} ${shoulderY} L${p.x + 11 * k} ${hipY + 2 * k} L${p.x - 11 * k} ${hipY + 2 * k}Z" fill="${p.shirt}" ${S} stroke-width="${sw}"/>`;
  const apron = p.apron ? `<path d="M${p.x - 8 * k} ${shoulderY + 8 * k} h${16 * k} v${18 * k} h${-16 * k}Z" fill="#fffaf0" ${S} stroke-width="${sw * 0.8}"/>` : '';
  const arms =
    `<path d="M${shL[0]} ${shL[1]} l${armL[0] * k} ${armL[1] * k}" stroke="${p.shirt}" stroke-width="${7 * k}" stroke-linecap="round"/>` +
    `<path d="M${shR[0]} ${shR[1]} l${armR[0] * k} ${armR[1] * k}" stroke="${p.shirt}" stroke-width="${7 * k}" stroke-linecap="round"/>` +
    `<g fill="none" ${S} stroke-width="${sw}"><path d="M${shL[0]} ${shL[1]} l${armL[0] * k} ${armL[1] * k} M${shR[0]} ${shR[1]} l${armR[0] * k} ${armR[1] * k}"/></g>` +
    `<g fill="${SKIN}" ${S} stroke-width="${sw * 0.8}"><circle cx="${shL[0] + armL[0] * k}" cy="${shL[1] + armL[1] * k}" r="${3.6 * k}"/><circle cx="${shR[0] + armR[0] * k}" cy="${shR[1] + armR[1] * k}" r="${3.6 * k}"/></g>`;
  const stick = p.stick ? `<path d="M${shR[0] + armR[0] * k} ${shR[1] + armR[1] * k} L${shR[0] + armR[0] * k + 2 * k} ${p.y}" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round"/>` : '';
  const hc = p.hairColor ?? INK;
  const hair: Record<Hair, string> = {
    boy: `<path d="M${p.x - headR} ${headY - 1 * k} C${p.x - headR} ${headY - headR * 1.25} ${p.x + headR} ${headY - headR * 1.25} ${p.x + headR} ${headY - 1 * k} C${p.x + 5 * k} ${headY - 6 * k} ${p.x - 5 * k} ${headY - 7 * k} ${p.x - headR} ${headY - 1 * k}Z" fill="${hc}" ${S} stroke-width="${sw}"/>`,
    girl:
      `<path d="M${p.x - headR - 1 * k} ${headY + 2 * k} C${p.x - headR} ${headY - headR * 1.3} ${p.x + headR} ${headY - headR * 1.3} ${p.x + headR + 1 * k} ${headY + 2 * k} C${p.x + 6 * k} ${headY - 7 * k} ${p.x - 6 * k} ${headY - 7 * k} ${p.x - headR - 1 * k} ${headY + 2 * k}Z" fill="${hc}" ${S} stroke-width="${sw}"/>` +
      `<g fill="${hc}" ${S} stroke-width="${sw * 0.8}"><ellipse cx="${p.x - headR - 3 * k}" cy="${headY + 4 * k}" rx="${3.5 * k}" ry="${6 * k}"/><ellipse cx="${p.x + headR + 3 * k}" cy="${headY + 4 * k}" rx="${3.5 * k}" ry="${6 * k}"/></g>` +
      `<g fill="#ff5532" stroke="none"><circle cx="${p.x - headR - 1 * k}" cy="${headY - 1 * k}" r="${2.2 * k}"/><circle cx="${p.x + headR + 1 * k}" cy="${headY - 1 * k}" r="${2.2 * k}"/></g>`,
    grey: `<path d="M${p.x - headR} ${headY} C${p.x - headR} ${headY - headR * 1.2} ${p.x + headR} ${headY - headR * 1.2} ${p.x + headR} ${headY} C${p.x + 5 * k} ${headY - 5 * k} ${p.x - 5 * k} ${headY - 5 * k} ${p.x - headR} ${headY}Z" fill="#dcdde6" ${S} stroke-width="${sw}"/><circle cx="${p.x}" cy="${headY - headR - 2 * k}" r="${4.5 * k}" fill="#dcdde6" ${S} stroke-width="${sw * 0.8}"/>`,
    man: `<path d="M${p.x - headR} ${headY - 2 * k} C${p.x - headR + 2 * k} ${headY - headR * 1.15} ${p.x + headR - 2 * k} ${headY - headR * 1.15} ${p.x + headR} ${headY - 2 * k} L${p.x + headR - 3 * k} ${headY - 5 * k} L${p.x - headR + 3 * k} ${headY - 5 * k}Z" fill="${hc}" ${S} stroke-width="${sw}"/>`,
    none: '',
  };
  const ex = (p.look ?? 0) * 2 * k;
  const eyeY = headY + 1 * k;
  const mouths: Record<Mood, string> = {
    happy: `<path d="M${p.x - 4 * k} ${headY + 6 * k} q${4 * k} ${4 * k} ${8 * k} 0" fill="none" ${S} stroke-width="${sw * 0.7}"/>`,
    calm: `<path d="M${p.x - 3 * k} ${headY + 7 * k} h${6 * k}" fill="none" ${S} stroke-width="${sw * 0.7}"/>`,
    oops: `<ellipse cx="${p.x}" cy="${headY + 7.5 * k}" rx="${2.5 * k}" ry="${3 * k}" fill="${INK}"/>`,
    sad: `<path d="M${p.x - 4 * k} ${headY + 9 * k} q${4 * k} ${-4 * k} ${8 * k} 0" fill="none" ${S} stroke-width="${sw * 0.7}"/>`,
    cry: `<path d="M${p.x - 4 * k} ${headY + 9 * k} q${4 * k} ${-4 * k} ${8 * k} 0" fill="none" ${S} stroke-width="${sw * 0.7}"/><path d="M${p.x - 6 * k + ex} ${eyeY + 3 * k} q${-1 * k} ${4 * k} 0 ${6 * k}" stroke="#4aa3ff" stroke-width="${2.2 * k}" fill="none"/>`,
  };
  const face =
    `<circle cx="${p.x}" cy="${headY}" r="${headR}" fill="${SKIN}" ${S} stroke-width="${sw}"/>` +
    hair[p.hair ?? 'boy'] +
    `<g fill="${INK}"><circle cx="${p.x - 4.5 * k + ex}" cy="${eyeY}" r="${1.7 * k}"/><circle cx="${p.x + 4.5 * k + ex}" cy="${eyeY}" r="${1.7 * k}"/></g>` +
    `<g fill="#ffb3c1" stroke="none" opacity=".8"><ellipse cx="${p.x - 7.5 * k}" cy="${headY + 5 * k}" rx="${2.4 * k}" ry="${1.5 * k}"/><ellipse cx="${p.x + 7.5 * k}" cy="${headY + 5 * k}" rx="${2.4 * k}" ry="${1.5 * k}"/></g>` +
    mouths[p.mood ?? 'happy'];
  return `<g>${legs}${body}${apron}${arms}${stick}${face}</g>`;
}

const ground = (y: number, fill: string) => `<path d="M0 ${y} H360 V270 H0Z" fill="${fill}" stroke="${INK}" stroke-width="2.6"/>`;
const motion = (x: number, y: number, n = 3, len = 12) =>
  `<g ${S} stroke-width="2" fill="none">${Array.from({ length: n }, (_, i) => `<path d="M${x} ${y + i * 6} h${-len + i * 3}"/>`).join('')}</g>`;
const tree = (x: number, y: number, r = 26) =>
  `<g ${S} stroke-width="2.6"><path d="M${x - 4} ${y} V${y - r * 1.6} H${x + 4} V${y}Z" fill="#c98a4b"/><circle cx="${x}" cy="${y - r * 2}" r="${r}" fill="#7fdc7a"/><circle cx="${x - r * 0.7}" cy="${y - r * 1.5}" r="${r * 0.6}" fill="#7fdc7a"/></g>`;

const VASE = [
  `<rect width="360" height="270" fill="#fff1c9"/>`,
  // shelves with pots
  `<g ${S} stroke-width="2.4"><path d="M196 40 H350 M196 92 H350" fill="none"/>`,
  `<path d="M210 40 c-4 -14 18 -14 14 0Z M244 40 c-6 -20 26 -20 20 0Z M290 40 c-4 -12 16 -12 12 0Z M322 40 c-5 -16 22 -16 18 0Z" fill="#4aa3ff"/>`,
  `<path d="M212 92 c-6 -18 24 -18 18 0Z M258 92 c-4 -14 18 -14 14 0Z M300 92 c-6 -20 26 -20 20 0Z" fill="#ffb3c1"/></g>`,
  ground(208, '#e6dcc8'),
  // counter + shopkeeper
  person({ x: 290, y: 200, h: 96, shirt: '#4aa3ff', pants: '#5d5864', hair: 'man', mood: 'oops', look: -1, apron: true, armL: [-14, 10], armR: [10, 22] }),
  `<g ${S} stroke-width="2.6"><path d="M236 150 H350 V208 H236Z" fill="#c98a4b"/><path d="M236 162 H350" fill="none"/></g>`,
  // low table, tipping vase, shards
  `<g ${S} stroke-width="2.6"><path d="M70 168 H150 V176 H70Z" fill="#c98a4b"/><path d="M78 176 V208 M142 176 V208" fill="none"/></g>`,
  `<g transform="rotate(38 150 156)" ${S} stroke-width="2.6"><path d="M140 168 c-12 -8 -10 -26 2 -30 v-8 h14 v8 c12 4 14 22 2 30Z" fill="#4aa3ff"/><path d="M144 150 h12" fill="none"/></g>`,
  `<g ${S} stroke-width="2.2" fill="#4aa3ff"><path d="M168 204 l10 -6 l4 7Z"/><path d="M186 206 l8 -9 l5 9Z"/><path d="M160 207 l-6 -5 l9 -2Z"/></g>`,
  `<g ${S} stroke-width="2" fill="none"><path d="M176 186 l4 -6 M190 190 l6 -4 M164 190 l-4 -5"/></g>`,
  // the boy, arm out, startled
  person({ x: 112, y: 232, shirt: '#ff9b3d', pants: '#4aa3ff', hair: 'boy', mood: 'oops', look: 1, armR: [22, -6], armL: [-12, 18] }),
].join('');

const WALLET = [
  `<rect width="360" height="270" fill="#eef5ff"/>`,
  tree(300, 190, 30),
  ground(190, '#c9efc6'),
  `<path d="M0 230 C120 214 240 226 360 214 V246 C240 258 120 246 0 262Z" fill="#e6dcc8" ${S} stroke-width="2.4"/>`,
  // bench
  `<g ${S} stroke-width="2.6"><path d="M40 160 H120 V170 H40Z M40 176 H120 V184 H40Z" fill="#c98a4b"/><path d="M48 184 V198 M112 184 V198" fill="none"/></g>`,
  // owner patting pockets, further away
  person({ x: 250, y: 214, h: 70, shirt: '#5d5864', pants: '#2a2630', hair: 'man', mood: 'sad', look: 1, armL: [-4, 20], armR: [4, 20] }),
  `<g ${S} stroke-width="2" fill="none"><path d="M268 150 q6 -8 0 -14 M276 154 q8 -10 0 -18"/></g>`,
  `<text x="270" y="144" font-size="16" font-weight="900" fill="${INK}">?</text>`,
  // girl bending to pick up the wallet
  person({ x: 120, y: 246, shirt: '#ffb3c1', hair: 'girl', skirt: true, mood: 'oops', look: 1, armR: [18, 18], armL: [-6, 20] }),
  `<g ${S} stroke-width="2.4"><rect x="150" y="236" width="22" height="14" rx="3" fill="#c98a4b"/><path d="M150 242 h22" fill="none"/></g>`,
].join('');

const GRANDMA = [
  `<rect width="360" height="270" fill="#eef5ff"/>`,
  // buildings
  `<g ${S} stroke-width="2.4"><path d="M10 60 H80 V170 H10Z" fill="#fffaf0"/><path d="M90 30 H150 V170 H90Z" fill="#dfe9f7"/><path d="M290 50 H350 V170 H290Z" fill="#fffaf0"/></g>`,
  `<g fill="#cfe4ff" ${S} stroke-width="2"><rect x="22" y="76" width="14" height="14"/><rect x="52" y="76" width="14" height="14"/><rect x="102" y="50" width="14" height="14"/><rect x="126" y="50" width="14" height="14"/><rect x="302" y="70" width="14" height="14"/><rect x="326" y="70" width="14" height="14"/></g>`,
  ground(170, '#c7c8d6'),
  // zebra crossing
  `<g fill="#fffaf0" ${S} stroke-width="2">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${40 + i * 48}" y="${196}" width="30" height="${60}" rx="2"/>`).join('')}</g>`,
  // traffic light (green on)
  `<g ${S} stroke-width="2.4"><path d="M258 170 V96" fill="none"/><rect x="248" y="70" width="20" height="40" rx="5" fill="${INK}"/><circle cx="258" cy="82" r="5" fill="#5d5864"/><circle cx="258" cy="98" r="5" fill="#7fdc7a"/></g>`,
  // two children holding grandma's arms
  person({ x: 120, y: 236, shirt: '#7fdc7a', pants: '#4aa3ff', hair: 'boy', mood: 'happy', look: 1, armR: [16, 6] }),
  person({ x: 168, y: 236, h: 84, shirt: '#ffb3c1', pants: '#8f8a93', hair: 'grey', mood: 'happy', look: -1, armL: [-12, 12], armR: [12, 16], stick: true, skirt: true }),
  `<g ${S} stroke-width="2.4"><path d="M196 216 h16 v18 h-16Z" fill="#ffc94a"/><path d="M198 216 q6 -8 12 0" fill="none"/></g>`,
  person({ x: 222, y: 236, shirt: '#ffc94a', hair: 'girl', skirt: true, mood: 'happy', look: -1, armL: [-14, 4] }),
].join('');

const QUEUE = [
  `<rect width="360" height="270" fill="#fff1c9"/>`,
  // menu board + counter
  `<g ${S} stroke-width="2.6"><rect x="230" y="22" width="110" height="56" rx="6" fill="${INK}"/><path d="M244 38 h40 M244 52 h60 M244 66 h30" stroke="#fffaf0" stroke-width="3"/></g>`,
  ground(196, '#e6dcc8'),
  person({ x: 304, y: 196, h: 110, shirt: '#fffaf0', pants: INK, hair: 'man', mood: 'calm', look: -1, apron: true }),
  `<g ${S} stroke-width="2.6"><path d="M250 134 H360 V196 H250Z" fill="#c98a4b"/><path d="M250 148 H360" fill="none"/></g>`,
  // the queue
  person({ x: 222, y: 238, shirt: '#4aa3ff', hair: 'girl', skirt: true, mood: 'calm', look: 1 }),
  person({ x: 176, y: 238, shirt: '#7fdc7a', hair: 'boy', mood: 'sad', look: 1 }),
  person({ x: 130, y: 238, shirt: '#ffc94a', hair: 'boy', mood: 'calm', look: 1 }),
  // a girl at the back, pointing
  person({ x: 70, y: 238, shirt: '#ffb3c1', hair: 'girl', skirt: true, mood: 'oops', look: 1, armR: [24, -8] }),
  // the boy darting in at the front
  person({ x: 250, y: 252, h: 70, shirt: '#ff5532', pants: '#5d5864', hair: 'boy', mood: 'happy', look: 1, legL: [-14, 22], legR: [12, 20], armL: [-16, 8], armR: [14, 4] }),
  motion(226, 222, 3, 16),
].join('');

const LITTER = [
  `<rect width="360" height="270" fill="#eef5ff"/>`,
  tree(40, 170, 26),
  tree(330, 160, 22),
  ground(170, '#c9efc6'),
  // bin
  `<g ${S} stroke-width="2.6"><path d="M268 196 h34 l-4 46 h-26Z" fill="#7fdc7a"/><path d="M264 190 h42 v8 h-42Z" fill="#5fbf5a"/><path d="M278 206 v26 M292 206 v26" fill="none"/></g>`,
  // boy tossing a wrapper
  person({ x: 92, y: 240, shirt: '#ffc94a', pants: '#4aa3ff', hair: 'boy', mood: 'happy', look: 1, armR: [20, -14] }),
  `<g ${S} stroke-width="2.2"><path d="M140 168 l12 -4 l4 9 l-12 4Z" fill="#ff9b3d"/></g>`,
  `<g ${S} stroke-width="1.8" fill="none" stroke-dasharray="3 4"><path d="M124 182 q10 -20 22 -12"/></g>`,
  `<g ${S} stroke-width="2.2"><path d="M170 238 l12 -3 l3 8 l-12 3Z" fill="#ff9b3d"/></g>`,
  // girl picking one up, towards the bin
  person({ x: 222, y: 246, shirt: '#ff5532', hair: 'girl', skirt: true, mood: 'calm', look: -1, armL: [-18, 18] }),
].join('');

const SHARE = [
  `<rect width="360" height="270" fill="#fffaf0"/>`,
  // blackboard + window
  `<g ${S} stroke-width="2.6"><rect x="24" y="20" width="150" height="70" rx="4" fill="#5d5864"/><rect x="230" y="22" width="100" height="64" rx="4" fill="#cfe4ff"/><path d="M280 22 V86 M230 54 H330" fill="none"/></g>`,
  `<path d="M40 40 h40 M40 56 h70" stroke="#fffaf0" stroke-width="3"/>`,
  ground(196, '#e6dcc8'),
  // two children at a desk
  person({ x: 112, y: 222, shirt: '#4aa3ff', pants: '#5d5864', hair: 'boy', mood: 'happy', look: 1, armR: [26, -4], armL: [-8, 20] }),
  person({ x: 246, y: 222, shirt: '#ffb3c1', hair: 'girl', skirt: true, mood: 'sad', look: -1, armL: [-12, 10] }),
  `<g ${S} stroke-width="2.6"><path d="M80 180 H290 V190 H80Z" fill="#c98a4b"/><path d="M92 190 V244 M278 190 V244" fill="none"/></g>`,
  // his lunch box, her empty one
  `<g ${S} stroke-width="2.4"><rect x="100" y="164" width="40" height="16" rx="4" fill="#7fdc7a"/><rect x="230" y="166" width="36" height="14" rx="4" fill="#fffaf0"/><path d="M234 170 h28" fill="none" stroke-dasharray="2 4"/></g>`,
  // half a sandwich held out
  `<g ${S} stroke-width="2.4"><path d="M142 172 l22 0 l-11 -16Z" fill="#ffe7a3"/><path d="M144 170 l18 0" stroke="#7fdc7a" stroke-width="3"/></g>`,
].join('');

const FALL = [
  `<rect width="360" height="270" fill="#eef5ff"/>`,
  // sick bay building with a red cross
  `<g ${S} stroke-width="2.6"><path d="M250 50 H350 V150 H250Z" fill="#fffaf0"/><path d="M262 66 h30 v30 h-30Z" fill="#fffaf0"/><path d="M300 110 h26 v40 h-26Z" fill="#cfe4ff"/></g>`,
  `<g fill="#ff5532"><rect x="272" y="70" width="10" height="22"/><rect x="266" y="76" width="22" height="10"/></g>`,
  ground(150, '#ff9b3d'),
  `<path d="M0 196 C120 186 240 200 360 188" stroke="#fffaf0" stroke-width="4" fill="none" stroke-dasharray="14 10"/>`,
  // a teacher coming in the background
  person({ x: 216, y: 176, h: 74, shirt: '#7fdc7a', pants: '#5d5864', hair: 'girl', skirt: true, mood: 'oops', look: -1, armL: [-14, 4] }),
  // child on the ground holding a knee
  `<g>${person({ x: 112, y: 248, h: 60, shirt: '#ffc94a', pants: '#4aa3ff', hair: 'boy', mood: 'cry', look: 1, legL: [-26, 10], legR: [22, 4], armL: [-14, 12], armR: [16, 14] })}</g>`,
  `<g fill="#ff5532" stroke="none"><ellipse cx="142" cy="242" rx="5" ry="3"/></g>`,
  // friend kneeling to help
  person({ x: 176, y: 248, shirt: '#ffb3c1', pants: '#5d5864', hair: 'boy', mood: 'oops', look: -1, armL: [-20, 4], legL: [-12, 14], legR: [10, 26] }),
].join('');

const SPILL = [
  `<rect width="360" height="270" fill="#fff1c9"/>`,
  `<g ${S} stroke-width="2.6"><rect x="20" y="30" width="100" height="50" rx="6" fill="${INK}"/></g><path d="M34 46 h40 M34 62 h56" stroke="#fffaf0" stroke-width="3"/>`,
  ground(196, '#e6dcc8'),
  `<g ${S} stroke-width="2.6"><path d="M240 150 H350 V160 H240Z" fill="#c98a4b"/><path d="M252 160 V210 M338 160 V210" fill="none"/></g>`,
  // boy with a cup, mid-collision
  person({ x: 136, y: 238, shirt: '#4aa3ff', pants: '#5d5864', hair: 'boy', mood: 'oops', look: 1, armR: [18, -8], legL: [-10, 26], legR: [14, 24] }),
  motion(108, 168, 3, 14),
  `<g ${S} stroke-width="2.4"><path d="M168 150 l14 -6 l6 16 l-12 4Z" fill="#fffaf0"/></g>`,
  // splash of drink
  `<g fill="#4aa3ff" ${S} stroke-width="1.8"><path d="M186 148 q10 -8 16 2 q-8 2 -16 -2Z"/><circle cx="206" cy="160" r="3.5"/><circle cx="198" cy="172" r="3"/><circle cx="212" cy="176" r="2.5"/></g>`,
  // girl, drink on her shirt
  person({ x: 226, y: 238, shirt: '#fffaf0', hair: 'girl', skirt: true, mood: 'oops', look: -1, armL: [-14, 4], armR: [12, 14] }),
  `<g fill="#4aa3ff" stroke="none" opacity=".85"><ellipse cx="222" cy="186" rx="6" ry="4"/><ellipse cx="230" cy="194" rx="4" ry="3"/></g>`,
].join('');

export const SCENE_ART: Record<SceneId, string> = {
  vase: VASE,
  wallet: WALLET,
  grandma: GRANDMA,
  queue: QUEUE,
  litter: LITTER,
  share: SHARE,
  fall: FALL,
  spill: SPILL,
};
