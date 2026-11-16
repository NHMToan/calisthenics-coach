// Skeletal rig for the animated coach avatar.
// Side view, figure faces +x. Angles are in degrees, screen coordinates (y points down):
// 0 = right, 90 = down, -90 = up, 180 = left.

export type Vec = [number, number];

/** A limb is either posed by absolute segment angles, or by an end-effector target solved with IK. */
export type Limb =
  | { kind: 'angles'; a: number; b: number }
  | { kind: 'target'; t: Vec; bend: 1 | -1 | 0 };

export type Pose = {
  hip: Vec;
  torso: number;
  /** extra head tilt relative to the torso */
  head?: number;
  arm: Limb;
  arm2?: Limb;
  leg: Limb;
  leg2?: Limb;
};

export type Prop =
  | { kind: 'bar'; y: number; x1: number; x2: number }
  | { kind: 'chair'; x: number; seat: number; w: number }
  | { kind: 'wall'; x: number };

export type Animation = {
  frames: Pose[];
  /** relative duration of each transition frame[i] -> frame[i+1] (last wraps to frame[0]) */
  weights?: number[];
  /** seconds for one full cycle (one rep) */
  cycle: number;
  props?: Prop[];
};

export const FLOOR = 185;
/** y of an ankle resting on the floor */
export const G = 181;

export const LEN = { torso: 48, neck: 7, head: 10, upper: 27, fore: 25, thigh: 38, shin: 37, foot: 10 };

// ---------- authoring helpers ----------
export const A = (a: number, b: number): Limb => ({ kind: 'angles', a, b });
/** IK target. Default bend: arms +1 (elbow toward the feet), legs -1 (knee forward). */
export const T = (x: number, y: number, bend?: 1 | -1): Limb => ({ kind: 'target', t: [x, y], bend: bend ?? 0 });

// ---------- math ----------
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpAngle = (a: number, b: number, t: number) => {
  let d = ((b - a) % 360 + 540) % 360 - 180; // shortest path
  return a + d * t;
};
const at = (o: Vec, angleDeg: number, len: number): Vec => [
  o[0] + Math.cos(rad(angleDeg)) * len,
  o[1] + Math.sin(rad(angleDeg)) * len,
];

type Solved = { a: number; b: number };

function ik(o: Vec, t: Vec, l1: number, l2: number, bend: number): Solved {
  const dx = t[0] - o[0];
  const dy = t[1] - o[1];
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const base = Math.atan2(dy, dx);
  const alpha = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const a1 = base + bend * alpha;
  const mid: Vec = [o[0] + l1 * Math.cos(a1), o[1] + l1 * Math.sin(a1)];
  const end: Vec = [o[0] + d * Math.cos(base), o[1] + d * Math.sin(base)];
  return { a: deg(a1), b: deg(Math.atan2(end[1] - mid[1], end[0] - mid[0])) };
}

function solveLimb(limb: Limb, origin: Vec, l1: number, l2: number, defBend: 1 | -1): Solved {
  if (limb.kind === 'angles') return { a: limb.a, b: limb.b };
  return ik(origin, limb.t, l1, l2, limb.bend || defBend);
}

function shoulderOf(hip: Vec, torso: number) {
  return at(hip, torso, LEN.torso);
}

function lerpLimb(
  x: Limb, y: Limb, t: number,
  ox: Vec, oy: Vec, l1: number, l2: number, defBend: 1 | -1,
): Limb {
  if (x.kind === 'target' && y.kind === 'target') {
    return { kind: 'target', t: [lerp(x.t[0], y.t[0], t), lerp(x.t[1], y.t[1], t)], bend: t < 0.5 ? x.bend : y.bend };
  }
  const sx = solveLimb(x, ox, l1, l2, defBend);
  const sy = solveLimb(y, oy, l1, l2, defBend);
  return { kind: 'angles', a: lerpAngle(sx.a, sy.a, t), b: lerpAngle(sx.b, sy.b, t) };
}

export function interpolatePose(p: Pose, q: Pose, t: number): Pose {
  const hip: Vec = [lerp(p.hip[0], q.hip[0], t), lerp(p.hip[1], q.hip[1], t)];
  const sp = shoulderOf(p.hip, p.torso);
  const sq = shoulderOf(q.hip, q.torso);
  return {
    hip,
    torso: lerpAngle(p.torso, q.torso, t),
    head: lerp(p.head ?? 0, q.head ?? 0, t),
    arm: lerpLimb(p.arm, q.arm, t, sp, sq, LEN.upper, LEN.fore, 1),
    arm2: lerpLimb(p.arm2 ?? p.arm, q.arm2 ?? q.arm, t, sp, sq, LEN.upper, LEN.fore, 1),
    leg: lerpLimb(p.leg, q.leg, t, p.hip, q.hip, LEN.thigh, LEN.shin, -1),
    leg2: lerpLimb(p.leg2 ?? p.leg, q.leg2 ?? q.leg, t, p.hip, q.hip, LEN.thigh, LEN.shin, -1),
  };
}

const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

/** Pose at normalized phase 0..1 of the animation cycle. */
export function poseAt(anim: Animation, phase: number): Pose {
  const n = anim.frames.length;
  if (n === 1) return anim.frames[0];
  const w = anim.weights ?? anim.frames.map(() => 1);
  const total = w.reduce((s, v) => s + v, 0);
  let x = (((phase % 1) + 1) % 1) * total;
  for (let i = 0; i < n; i++) {
    if (x <= w[i] || i === n - 1) {
      const local = clamp(x / w[i], 0, 1);
      return interpolatePose(anim.frames[i], anim.frames[(i + 1) % n], easeInOut(local));
    }
    x -= w[i];
  }
  return anim.frames[0];
}

export type Skeleton = {
  hip: Vec; shoulder: Vec; neck: Vec; headC: Vec; faceDir: number;
  arm: [Vec, Vec]; arm2: [Vec, Vec];
  leg: [Vec, Vec, Vec]; leg2: [Vec, Vec, Vec]; // knee, ankle, toe
};

export function solve(p: Pose): Skeleton {
  const shoulder = shoulderOf(p.hip, p.torso);
  // when the torso leans forward from upright, people keep looking ahead: lift the head a bit
  const lean = p.torso > -88 && p.torso < -30 ? (p.torso + 90) * 0.3 : 0;
  const headAngle = p.torso + (p.head ?? 0) - lean;
  const neck = at(shoulder, headAngle, LEN.neck);
  const headC = at(shoulder, headAngle, LEN.neck + LEN.head);
  const arm = (l: Limb): [Vec, Vec] => {
    const s = solveLimb(l, shoulder, LEN.upper, LEN.fore, 1);
    const e = at(shoulder, s.a, LEN.upper);
    return [e, at(e, s.b, LEN.fore)];
  };
  const leg = (l: Limb): [Vec, Vec, Vec] => {
    const s = solveLimb(l, p.hip, LEN.thigh, LEN.shin, -1);
    const k = at(p.hip, s.a, LEN.thigh);
    const an = at(k, s.b, LEN.shin);
    let toe = at(an, s.b - 90, LEN.foot);
    // keep the foot above the floor (e.g. toes in a plank): pivot it around the ankle onto the floor line
    const floorY = FLOOR - 1.5;
    if (toe[1] > floorY && an[1] < floorY) {
      const dy = floorY - an[1];
      const dx = Math.sqrt(Math.max(0, LEN.foot * LEN.foot - dy * dy));
      toe = [an[0] + (toe[0] >= an[0] ? dx : -dx), floorY];
    }
    return [k, an, toe];
  };
  return {
    hip: p.hip, shoulder, neck, headC, faceDir: headAngle + 90,
    arm: arm(p.arm), arm2: arm(p.arm2 ?? p.arm),
    leg: leg(p.leg), leg2: leg(p.leg2 ?? p.leg),
  };
}
