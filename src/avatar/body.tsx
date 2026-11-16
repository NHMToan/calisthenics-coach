// Character renderer: draws a shaded, anatomically shaped figure on top of a solved skeleton.
// Every body part is an outline generator `(k, off) => path`, so it can be drawn as three
// cel-shading layers: core shadow (full size), lit mid-tone (slightly smaller, nudged toward
// the light) and a soft highlight. Light comes from the window: upper-left.
import { G, Line, Path } from 'react-native-svg';
import type { Skeleton, Vec } from './rig';

// ---------- palette ----------
type Tone = { dark: string; mid: string; light: string };
const tone = (dark: string, mid: string, light: string): Tone => ({ dark, mid, light });

const NEAR = {
  skin: tone('#C88763', '#E9AE85', '#F8CFAA'),
  shirt: tone('#1A8CB0', '#36C3E8', '#8DE9FB'),
  shorts: tone('#151C27', '#273345', '#41536B'),
  shoe: tone('#BFC6CF', '#F1F3F6', '#FFFFFF'),
  sole: '#C6F432',
};
const FAR = {
  skin: tone('#93593F', '#B57858', '#C99272'),
  shirt: tone('#0F5F78', '#1A8DAE', '#3FB5D3'),
  shorts: tone('#0D121A', '#1A2230', '#29364A'),
  shoe: tone('#8E959E', '#B8BFC7', '#D3D8DE'),
  sole: '#8BA72E',
};
const HAIR = tone('#1E1612', '#2E221C', '#5A4436');
const EYE = '#1B130F';
const BROW = '#2A1D16';
type Palette = typeof NEAR;

const LIGHT: Vec = [-0.55, -0.83];

// ---------- vector helpers ----------
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k];
const len = (a: Vec) => Math.hypot(a[0], a[1]);
const unit = (a: Vec): Vec => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
/** rotate +90° on screen (y down) */
const perp = (a: Vec): Vec => [-a[1], a[0]];
const f = (p: Vec) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;

/** Smooth closed outline through points (Catmull-Rom → cubic Bézier). */
function smooth(pts: Vec[]) {
  const n = pts.length;
  let d = `M${f(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += ` C${f(add(p1, mul(sub(p2, p0), 1 / 6)))} ${f(sub(p2, mul(sub(p3, p1), 1 / 6)))} ${f(p2)}`;
  }
  return d + ' Z';
}

type Gen = (k: number, off: Vec) => string;

/**
 * Muscle-shaped limb along bone a→b. Each profile row is [t, widthOnPerpSide, widthOnOtherSide]
 * where t runs 0..1 along the bone. For legs and arms the perp side is the back of the limb
 * (hamstring/calf, triceps) because the joints only bend one way.
 */
function limb(a: Vec, b: Vec, prof: [number, number, number][], capA: number, capB: number): Gen {
  return (k, off) => {
    const A = add(a, off);
    const B = add(b, off);
    const d = sub(B, A);
    const L = len(d);
    const u = L < 0.01 ? ([0, 1] as Vec) : unit(d);
    const n = perp(u);
    const at = (t: number, w: number) => add(add(A, mul(u, t * L)), mul(n, w * k));
    const pts: Vec[] = [add(A, mul(u, -capA * k))];
    for (const [t, wp] of prof) pts.push(at(t, wp));
    pts.push(add(B, mul(u, capB * k)));
    for (let i = prof.length - 1; i >= 0; i--) pts.push(at(prof[i][0], -prof[i][2]));
    return smooth(pts);
  };
}

/** Three-tone cel-shaded part. */
function Shaded({ gen, c, hl = 0.5 }: { gen: Gen; c: Tone; hl?: number }) {
  return (
    <G>
      <Path d={gen(1, [0, 0])} fill={c.dark} />
      <Path d={gen(0.84, mul(LIGHT, 0.75))} fill={c.mid} />
      <Path d={gen(0.38, mul(LIGHT, 1.6))} fill={c.light} opacity={hl} />
    </G>
  );
}

// ---------- profiles ----------
// [t, back, front]
const UPPER_ARM: [number, number, number][] = [[0.04, 5.0, 4.8], [0.35, 4.5, 4.3], [0.58, 4.0, 4.7], [0.85, 3.3, 3.4], [1, 3.1, 3.1]];
const FOREARM: [number, number, number][] = [[0, 3.2, 3.2], [0.22, 3.4, 3.9], [0.6, 2.7, 2.9], [1, 2.2, 2.3]];
const SLEEVE: [number, number, number][] = [[0, 5.9, 5.7], [0.55, 5.3, 5.4], [0.62, 5.2, 5.3]];
const THIGH: [number, number, number][] = [[0, 6.6, 6.3], [0.3, 6.4, 6.7], [0.62, 5.4, 5.9], [0.9, 4.4, 4.5], [1, 4.2, 4.2]];
const SHORTS: [number, number, number][] = [[0, 7.6, 7.4], [0.45, 7.3, 7.6], [0.6, 7.0, 7.3]];
const SHIN: [number, number, number][] = [[0, 4.1, 4.0], [0.24, 5.3, 3.7], [0.5, 4.3, 3.1], [0.82, 2.7, 2.6], [1, 2.4, 2.4]];

// ---------- parts ----------
function Arm({ sh, el, wr, p }: { sh: Vec; el: Vec; wr: Vec; p: Palette }) {
  const fu = unit(sub(wr, el));
  const fist = add(wr, mul(fu, 3.2));
  const thumb = add(add(wr, mul(fu, 2.2)), mul(perp(fu), -2.6));
  const elbowToSleeve = add(sh, mul(sub(el, sh), 0.62));
  return (
    <G>
      <Shaded gen={limb(sh, el, UPPER_ARM, 3.6, 2.6)} c={p.skin} />
      <Shaded gen={limb(el, wr, FOREARM, 2.4, 1.6)} c={p.skin} />
      <Shaded gen={limb(wr, fist, [[0, 2.5, 2.5], [0.5, 3.0, 2.9], [1, 2.6, 2.4]], 1.0, 1.8)} c={p.skin} hl={0.35} />
      <Path d={limb(thumb, add(thumb, mul(fu, 1.6)), [[0, 1.2, 1.2], [1, 1.1, 1.1]], 0.8, 0.8)(1, [0, 0])} fill={p.skin.dark} />
      <Shaded gen={limb(sh, elbowToSleeve, SLEEVE, 4.4, 1.2)} c={p.shirt} hl={0.45} />
    </G>
  );
}

function Shoe({ ankle, toe, p }: { ankle: Vec; toe: Vec; p: Palette }) {
  const s = unit(sub(toe, ankle));
  const n = perp(s); // sole side
  const at = (x: number, y: number) => add(ankle, add(mul(s, x), mul(n, y)));
  const gen: Gen = (k, off) =>
    smooth([at(-3, -3.3), at(-3.9, 0), at(-3.2, 2.7), at(3.5, 3.1), at(10.4, 2.8), at(11.8, 1.1), at(10, -1.3), at(5.4, -2.4), at(1, -3.7)].map((q) => add(add(ankle, mul(sub(q, ankle), 0.6 + 0.4 * k)), off)));
  const a = at(-3.4, 2.5);
  const b = at(11.2, 2.3);
  const lace1 = at(2, -2.9);
  const lace2 = at(6.5, -1.9);
  return (
    <G>
      <Shaded gen={gen} c={p.shoe} hl={0.6} />
      <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={p.sole} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={lace1[0]} y1={lace1[1]} x2={lace2[0]} y2={lace2[1]} stroke={p.shoe.dark} strokeWidth={0.8} strokeLinecap="round" strokeDasharray="1.2 1" />
    </G>
  );
}

function Leg({ hip, kn, an, toe, p }: { hip: Vec; kn: Vec; an: Vec; toe: Vec; p: Palette }) {
  const hem = add(hip, mul(sub(kn, hip), 0.6));
  return (
    <G>
      <Shaded gen={limb(hip, kn, THIGH, 5, 3.4)} c={p.skin} />
      <Shaded gen={limb(kn, an, SHIN, 3, 1.8)} c={p.skin} />
      <Shaded gen={limb(hip, hem, SHORTS, 6.5, 1.5)} c={p.shorts} hl={0.4} />
      <Shoe ankle={an} toe={toe} p={p} />
    </G>
  );
}

/** Athletic torso: narrow waist, broad chest, lats, trapezius slope into the neck. */
function torsoGen(hip: Vec, shoulder: Vec): Gen {
  return (k, off) => {
    const u = unit(sub(shoulder, hip));
    const n = perp(u); // front of the body
    const L = len(sub(shoulder, hip));
    const at = (t: number, w: number) => add(add(add(hip, mul(u, t * L)), mul(n, w * k)), off);
    return smooth([
      at(-0.06, -7.6), // seat
      at(0.0, 7.6), // hip front
      at(0.4, 7.0), // waist front
      at(0.66, 8.8), // lower chest
      at(0.86, 10.0), // pec
      at(1.04, 7.0), // front delt
      at(1.12, 1.5), // trapezius
      at(1.04, -6.0), // rear delt
      at(0.8, -9.4), // lats
      at(0.36, -7.0), // lower back
    ]);
  };
}

function Head({ s }: { s: Skeleton }) {
  const up = unit(sub(s.headC, s.shoulder));
  const fwd: Vec = [Math.cos((s.faceDir * Math.PI) / 180), Math.sin((s.faceDir * Math.PI) / 180)];
  // head drawn 15% larger and sat 1.6 units lower than the rig's head centre: shorter neck, more natural proportions
  const HS = 1.15;
  const c = add(s.headC, mul(up, -1.6));
  const at = (x: number, y: number): Vec => add(c, add(mul(fwd, x * HS), mul(up, y * HS)));
  const shape = (pts: [number, number][]) => smooth(pts.map(([x, y]) => at(x, y)));

  const neck = limb(add(s.shoulder, mul(up, -1)), at(-1.2, -5.4), [[0, 4.6, 4.4], [1, 4.0, 3.8]], 1, 1.5);
  const face = shape([[-6.4, -3.4], [-7.8, 2], [-3, 8.6], [3.5, 8.6], [7.6, 5.4], [8.7, 2.6], [8.2, 1.0], [9.9, -1.3], [8.5, -2.6], [8.8, -4.1], [7.7, -5.8], [4.6, -7.2], [0.5, -6.4]]);
  const cheekShadow = shape([[-5.6, -3.2], [-2, -2.2], [1.5, -5], [4.6, -7.2], [0.5, -6.6]]);
  const hair = shape([[-9.2, 0.6], [-8.6, 6.2], [-3.6, 10.6], [3.2, 10.6], [8.2, 7.6], [9.6, 4.6], [6.4, 5.4], [3.4, 4.6], [0.6, 6.2], [-3.4, 3.2], [-5.6, -1.4], [-8.2, -2.6]]);
  const hairHl = shape([[-5.6, 7.6], [-1, 9.8], [4.4, 9.4], [1.4, 8.4], [-3.4, 6.6]]);
  const ear = shape([[-0.2, 1.6], [-3.0, 1.2], [-3.2, -2.0], [-0.6, -2.6], [0.4, -0.6]]);
  const b1 = at(4.6, 3.1);
  const b2 = at(7.9, 3.0);

  return (
    <G>
      <Shaded gen={neck} c={NEAR.skin} hl={0} />
      <Path d={face} fill={NEAR.skin.mid} />
      <Path d={cheekShadow} fill={NEAR.skin.dark} opacity={0.55} />
      <Path d={hair} fill={HAIR.mid} />
      <Path d={hairHl} fill={HAIR.light} opacity={0.7} />
      <Path d={ear} fill={NEAR.skin.mid} />
      <Path d={ear} fill={NEAR.skin.dark} opacity={0.35} />
      <Line x1={b1[0]} y1={b1[1]} x2={b2[0]} y2={b2[1]} stroke={BROW} strokeWidth={1.1} strokeLinecap="round" />
      <Path d={shape([[5.6, 1.2], [6.4, 1.9], [7.1, 1.1], [6.4, 0.6]])} fill={EYE} />
    </G>
  );
}

/** The whole character, back to front. */
export function Body({ s }: { s: Skeleton }) {
  const pelvis = limb(s.hip, add(s.hip, mul(unit(sub(s.shoulder, s.hip)), 6)), [[0, 8.2, 8.0], [1, 7.6, 7.4]], 3, 1);
  return (
    <G>
      {/* far side */}
      <Arm sh={s.shoulder} el={s.arm2[0]} wr={s.arm2[1]} p={FAR} />
      <Leg hip={s.hip} kn={s.leg2[0]} an={s.leg2[1]} toe={s.leg2[2]} p={FAR} />

      {/* torso */}
      <Shaded gen={pelvis} c={NEAR.shorts} hl={0.3} />
      <Shaded gen={torsoGen(s.hip, s.shoulder)} c={NEAR.shirt} hl={0.45} />

      {/* near side */}
      <Leg hip={s.hip} kn={s.leg[0]} an={s.leg[1]} toe={s.leg[2]} p={NEAR} />
      <Head s={s} />
      <Arm sh={s.shoulder} el={s.arm[0]} wr={s.arm[1]} p={NEAR} />
    </G>
  );
}
