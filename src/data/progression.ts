// Progression: scale a program up/down from "how did it feel" answers, suggest harder variants,
// and find where the "up"/"down" tempo cues fall inside one rep.
import { Animation, solve, poseAt } from '../avatar/rig';
import { EXERCISE_MAP } from './exercises';
import { Program, ProgramItem } from './programs';
import { MAX_COUNT, SECOND_AMOUNTS } from './voiceLines';

/** One step harder, same mode (reps→reps, time→time). */
export const HARDER: Record<string, string> = {
  'knee-pushup': 'pushup',
  pushup: 'diamond-pushup',
  'diamond-pushup': 'archer-pushup',
  squat: 'jump-squat',
  'reverse-lunge': 'bulgarian-split-squat',
  'bulgarian-split-squat': 'assisted-pistol-squat',
  'glute-bridge': 'bridge-legraise',
  plank: 'hollow-hold',
  'hollow-hold': 'l-sit',
  burpee: 'burpee-tuck-jump',
  'mountain-climber': 'bear-crawl',
  'plank-up-down': 'updown-pushup',
  'pushup-jump': 'burpee-tuck-jump',
};

/** Seconds are snapped to amounts the coach has a recording for. */
export const snapSeconds = (s: number) =>
  SECOND_AMOUNTS.reduce((best, v) => (Math.abs(v - s) < Math.abs(best - s) ? v : best), SECOND_AMOUNTS[0]);

export const clampReps = (r: number) => Math.max(1, Math.min(MAX_COUNT, Math.round(r)));

export function scaleItem(it: ProgramItem, adjust: number): ProgramItem {
  if (!adjust) return it;
  const f = 1 + 0.1 * adjust;
  if (it.reps) {
    // at least one rep per step, so small targets (5 pull-ups) still change
    const scaled = Math.round(it.reps * f);
    return { ...it, reps: clampReps(adjust > 0 ? Math.max(it.reps + adjust, scaled) : Math.min(it.reps + adjust, scaled)) };
  }
  if (it.seconds) {
    // like reps, every step must change the hold: 15s × 1.1 = 16.5 would otherwise snap back to 15
    const snapped = snapSeconds(it.seconds * f);
    if (snapped !== it.seconds) return { ...it, seconds: snapped };
    const i = SECOND_AMOUNTS.indexOf(snapped);
    const j = Math.max(0, Math.min(SECOND_AMOUNTS.length - 1, i + (adjust > 0 ? 1 : -1)));
    return { ...it, seconds: i < 0 ? snapped : SECOND_AMOUNTS[j] };
  }
  return it;
}

export function applyAdjust(p: Program, adjust: number): Program {
  if (!adjust) return p;
  return { ...p, items: p.items.map((it) => scaleItem(it, adjust)) };
}

/** Exercises in the program that have a harder variant: [from, to]. */
export function harderSwaps(p: Program): [string, string][] {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  for (const it of p.items) {
    const to = HARDER[it.id];
    if (to && !seen.has(it.id) && EXERCISE_MAP[to]) {
      seen.add(it.id);
      out.push([it.id, to]);
    }
  }
  return out;
}

/**
 * Tempo cue for one rep: reps are counted at phase 0, so the cue goes at the opposite end of the
 * movement — "up!" at the bottom when the rep starts at the top (squat, push-up), "lower slowly" at
 * the top when it starts at the bottom (bridge). Height = body center (hip + shoulder).
 * Returns null when the body barely moves (leg raise, superman…), where up/down makes no sense.
 */
export function tempoCue(anim: Animation): { key: 'up' | 'down'; at: number } | null {
  if (anim.frames.length < 2) return null;
  const w = anim.weights ?? anim.frames.map(() => 1);
  const total = w.reduce((a, b) => a + b, 0);
  const samples: { at: number; y: number }[] = [];
  for (let i = 0; i < 40; i++) {
    const at = i / 40;
    const sk = solve(poseAt(anim, at));
    samples.push({ at, y: (sk.hip[1] + sk.shoulder[1]) / 2 });
  }
  const ys = samples.map((s) => s.y);
  const lo = Math.min(...ys), hi = Math.max(...ys);
  if (hi - lo < 14 || total <= 0) return null;
  const y0 = ys[0];
  const startsHigh = y0 - lo < hi - y0; // smaller y = higher on screen
  const target = startsHigh ? hi : lo;
  const at = samples.find((s) => s.y === target)!.at;
  if (at < 0.2 || at > 0.85) return null; // extreme too close to the count: they'd collide
  return { key: startsHigh ? 'up' : 'down', at };
}
