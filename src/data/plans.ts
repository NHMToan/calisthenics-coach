// 4-week plans: a fixed sequence of sessions built from the existing programs.
// Progress is counted in sessions, not calendar days: missing a day never puts you "behind",
// the next session simply waits. Each week adds `step` progression steps (+10% reps/seconds each)
// on top of the user's own per-program level from the "how did it feel" answers.
import { EXERCISE_MAP, Equipment, Text } from './exercises';
import { PROGRAM_MAP } from './programs';

export type PlanWeek = { focus: Text; step: number; days: string[] };

export type Plan = {
  id: string;
  emoji: string;
  level: 1 | 2 | 3;
  title: Text;
  goal: Text;
  weeks: PlanWeek[];
};

export const PLANS: Plan[] = [
  {
    id: 'foundation', emoji: '🌱', level: 1,
    title: { vi: 'Nền tảng 4 tuần', en: '4-week foundation' },
    goal: { vi: 'Xây thói quen tập đều và khoẻ toàn thân, bắt đầu từ con số 0.', en: 'Build the habit and full-body strength, starting from zero.' },
    weeks: [
      { step: 0, focus: { vi: 'Làm quen động tác', en: 'Learn the moves' }, days: ['beginner-full', 'core-8', 'region-lower'] },
      { step: 1, focus: { vi: 'Tăng khối lượng', en: 'More volume' }, days: ['beginner-full', 'core-8', 'region-lower'] },
      { step: 1, focus: { vi: 'Thêm bài bụng mới', en: 'New core work' }, days: ['beginner-full', 'region-core', 'region-lower'] },
      { step: 2, focus: { vi: 'Về đích với combo', en: 'Finish with combos' }, days: ['beginner-full', 'combo-burn', 'region-lower'] },
    ],
  },
  {
    id: 'burn', emoji: '⚡', level: 2,
    title: { vi: 'Đốt mỡ 4 tuần', en: '4-week fat burn' },
    goal: { vi: 'HIIT và combo liên tục để đốt calo, tăng sức bền.', en: 'HIIT and combos to burn calories and build stamina.' },
    weeks: [
      { step: 0, focus: { vi: 'Khởi động nhịp tim', en: 'Get the heart going' }, days: ['hiit-10', 'region-core', 'combo-burn', 'region-lower'] },
      { step: 1, focus: { vi: 'Tăng cường độ', en: 'Turn it up' }, days: ['hiit-10', 'region-core', 'combo-burn', 'region-lower'] },
      { step: 2, focus: { vi: 'Đẩy giới hạn', en: 'Push the limit' }, days: ['hiit-10', 'region-core', 'combo-burn', 'region-lower'] },
      { step: 3, focus: { vi: 'Tuần bứt tốc', en: 'Sprint week' }, days: ['hiit-10', 'region-core', 'combo-burn', 'region-lower'] },
    ],
  },
  {
    id: 'strength', emoji: '🏆', level: 3,
    title: { vi: 'Sức mạnh calisthenics', en: 'Calisthenics strength' },
    goal: { vi: 'Kéo xà, hít đất biến thể và chân một bên cho người đã có nền tảng.', en: 'Pull-ups, push-up variations and single-leg work for people with a base.' },
    weeks: [
      { step: 0, focus: { vi: 'Nền tảng kéo & đẩy', en: 'Pull & push base' }, days: ['intermediate', 'region-arms', 'push-legs-pro'] },
      { step: 1, focus: { vi: 'Tăng số lần', en: 'More reps' }, days: ['intermediate', 'region-arms', 'push-legs-pro'] },
      { step: 0, focus: { vi: 'Lên bài nâng cao', en: 'Advanced moves' }, days: ['advanced-bar', 'region-shoulders', 'push-legs-pro'] },
      { step: 1, focus: { vi: 'Kiểm tra sức mạnh', en: 'Strength test' }, days: ['advanced-bar', 'region-shoulders', 'push-legs-pro'] },
    ],
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<string, Plan>;

export type PlanEntry = { index: number; week: number; day: number; programId: string; step: number };

/** Every session of the plan in order. */
export const planEntries = (p: Plan): PlanEntry[] => {
  let index = 0;
  return p.weeks.flatMap((w, week) => w.days.map((programId, day) => ({ index: index++, week, day, programId, step: w.step })));
};

/** The next session after `done` completed ones, or null when the plan is finished. */
export const planNext = (p: Plan, done: number): PlanEntry | null => planEntries(p)[done] ?? null;

export const planSessionsPerWeek = (p: Plan) => Math.max(...p.weeks.map((w) => w.days.length));

/** Equipment any session needs, so a plan never hides that it wants a bar or a chair. */
export const planEquipment = (p: Plan): Equipment[] => {
  const out = new Set<Equipment>();
  for (const w of p.weeks)
    for (const id of w.days)
      for (const it of PROGRAM_MAP[id]?.items ?? []) {
        const eq = EXERCISE_MAP[it.id]?.equipment;
        if (eq && eq !== 'none') out.add(eq);
      }
  return [...out];
};
