import { Text } from './exercises';
import type { Region } from './regions';

export type ProgramItem = { id: string; reps?: number; seconds?: number };

export type Program = {
  id: string;
  title: Text;
  subtitle: Text;
  level: 1 | 2 | 3;
  rounds: number;
  /** rest between exercises, seconds */
  rest: number;
  /** rest between rounds, seconds */
  roundRest: number;
  items: ProgramItem[];
  emoji: string;
  /** body-region programs (shown in their own row on the home screen) */
  region?: Region;
};

export const PROGRAMS: Program[] = [
  {
    id: 'warmup', emoji: '🔥', level: 1, rounds: 1, rest: 10, roundRest: 0,
    title: { vi: 'Khởi động 4 phút', en: '4-min warm-up' },
    subtitle: { vi: 'Làm nóng cơ thể trước mỗi buổi tập', en: 'Get warm before every session' },
    items: [{ id: 'arm-circles', seconds: 30 }, { id: 'high-knees', seconds: 30 }, { id: 'squat', reps: 10 }, { id: 'glute-bridge', reps: 10 }, { id: 'high-knees', seconds: 30 }],
  },
  {
    id: 'beginner-full', emoji: '🌱', level: 1, rounds: 3, rest: 30, roundRest: 60,
    title: { vi: 'Người mới – Toàn thân', en: 'Beginner – Full body' },
    subtitle: { vi: '3 vòng, không cần dụng cụ', en: '3 rounds, no equipment' },
    items: [{ id: 'squat', reps: 12 }, { id: 'knee-pushup', reps: 8 }, { id: 'glute-bridge', reps: 12 }, { id: 'superman', reps: 10 }, { id: 'plank', seconds: 20 }],
  },
  {
    id: 'core-8', emoji: '🎯', level: 1, rounds: 2, rest: 20, roundRest: 45,
    title: { vi: 'Bụng 8 phút', en: '8-min core' },
    subtitle: { vi: 'Siết cơ bụng & lưng dưới', en: 'Abs & lower back' },
    items: [{ id: 'plank', seconds: 30 }, { id: 'leg-raise', reps: 10 }, { id: 'superman', reps: 10 }, { id: 'mountain-climber', seconds: 30 }],
  },
  {
    id: 'intermediate', emoji: '💪', level: 2, rounds: 3, rest: 25, roundRest: 60,
    title: { vi: 'Trung cấp – Calisthenics nền tảng', en: 'Intermediate – Foundations' },
    subtitle: { vi: 'Cần 1 chiếc ghế chắc chắn', en: 'Needs a sturdy chair' },
    items: [{ id: 'pushup', reps: 12 }, { id: 'jump-squat', reps: 10 }, { id: 'reverse-lunge', reps: 12 }, { id: 'chair-dip', reps: 10 }, { id: 'leg-raise', reps: 12 }, { id: 'mountain-climber', seconds: 30 }],
  },
  {
    id: 'combo-burn', emoji: '🧩', level: 2, rounds: 3, rest: 30, roundRest: 60,
    title: { vi: 'Combo đốt mỡ', en: 'Combo burn' },
    subtitle: { vi: 'Bài kết hợp nhiều động tác liền mạch', en: 'Chained moves, no equipment' },
    items: [{ id: 'squat-lunge', reps: 6 }, { id: 'pushup-climber', reps: 8 }, { id: 'bridge-legraise', reps: 6 }, { id: 'pushup-jump', reps: 5 }],
  },
  {
    id: 'hiit-10', emoji: '⚡', level: 2, rounds: 3, rest: 20, roundRest: 40,
    title: { vi: 'HIIT đốt mỡ 10 phút', en: '10-min fat-burn HIIT' },
    subtitle: { vi: '40 giây tập / 20 giây nghỉ', en: '40s work / 20s rest' },
    items: [{ id: 'high-knees', seconds: 40 }, { id: 'jump-squat', reps: 15 }, { id: 'mountain-climber', seconds: 40 }, { id: 'burpee', reps: 8 }],
  },
  {
    id: 'advanced-bar', emoji: '🏆', level: 3, rounds: 4, rest: 45, roundRest: 90,
    title: { vi: 'Nâng cao – Kéo & Đẩy', en: 'Advanced – Push & Pull' },
    subtitle: { vi: 'Cần xà đơn', en: 'Needs a pull-up bar' },
    items: [{ id: 'pullup', reps: 6 }, { id: 'pike-pushup', reps: 8 }, { id: 'pushup', reps: 15 }, { id: 'dead-hang', seconds: 30 }, { id: 'burpee', reps: 10 }, { id: 'plank', seconds: 45 }],
  },
  {
    id: 'push-legs-pro', emoji: '🦵', level: 2, rounds: 3, rest: 30, roundRest: 75,
    title: { vi: 'Push & legs nâng cao', en: 'Advanced push & legs' },
    subtitle: { vi: 'Ngực, vai, chân – cần 1 chiếc ghế chắc chắn', en: 'Chest, shoulders, legs – needs a sturdy chair' },
    items: [{ id: 'diamond-pushup', reps: 10 }, { id: 'bulgarian-split-squat', reps: 10 }, { id: 'decline-pushup', reps: 10 }, { id: 'lunge-knee-drive', reps: 12 }, { id: 'hindu-pushup', reps: 8 }, { id: 'skater-hop', seconds: 30 }, { id: 'hollow-hold', seconds: 30 }],
  },
  {
    id: 'combo-killer', emoji: '💀', level: 3, rounds: 3, rest: 40, roundRest: 90,
    title: { vi: 'Combo sát thủ', en: 'Killer combos' },
    subtitle: { vi: 'Combo cường độ cao – cần xà đơn và 1 chiếc ghế', en: 'High-intensity combos – needs a pull-up bar and a chair' },
    items: [{ id: 'burpee-tuck-jump', reps: 6 }, { id: 'chinup-knee-raise', reps: 5 }, { id: 'bulgarian-jump', reps: 6 }, { id: 'updown-pushup', reps: 6 }, { id: 'archer-pushup', reps: 6 }, { id: 'bear-crawl', seconds: 30 }, { id: 'l-sit', seconds: 15 }],
  },
  // ---------------- BODY-REGION PROGRAMS ----------------
  {
    id: 'region-arms', region: 'arms', emoji: '💪', level: 2, rounds: 3, rest: 30, roundRest: 60,
    title: { vi: 'Tay săn chắc', en: 'Arm day' },
    subtitle: { vi: 'Tay trước, tay sau – cần ghế và xà đơn', en: 'Biceps & triceps – needs a chair and a pull-up bar' },
    items: [{ id: 'chair-dip', reps: 12 }, { id: 'chinup', reps: 5 }, { id: 'diamond-pushup', reps: 8 }, { id: 'negative-pullup', reps: 4 }, { id: 'plank-up-down', reps: 10 }],
  },
  {
    id: 'region-shoulders', region: 'shoulders', emoji: '🏋️', level: 2, rounds: 3, rest: 25, roundRest: 60,
    title: { vi: 'Vai khoẻ, vai đẹp', en: 'Strong shoulders' },
    subtitle: { vi: 'Vai trước, vai sau, lưng trên – không dụng cụ', en: 'Front & rear delts, upper back – no equipment' },
    items: [{ id: 'arm-circles', seconds: 30 }, { id: 'prone-ytw', reps: 8 }, { id: 'pike-pushup', reps: 8 }, { id: 'plank-shoulder-tap', reps: 16 }, { id: 'plank-to-downdog', reps: 8 }],
  },
  {
    id: 'region-core', region: 'core', emoji: '🎯', level: 2, rounds: 3, rest: 20, roundRest: 45,
    title: { vi: 'Core toàn diện', en: 'Complete core' },
    subtitle: { vi: 'Bụng, bụng chéo, lưng dưới', en: 'Abs, obliques, lower back' },
    items: [{ id: 'dead-bug', reps: 12 }, { id: 'bicycle-crunch', reps: 20 }, { id: 'side-plank', seconds: 30 }, { id: 'russian-twist', reps: 20 }, { id: 'hollow-hold', seconds: 20 }, { id: 'plank-shoulder-tap', reps: 16 }],
  },
  {
    id: 'region-legs', region: 'legs', emoji: '🏃', level: 2, rounds: 3, rest: 30, roundRest: 60,
    title: { vi: 'Chân & mông', en: 'Legs & glutes' },
    subtitle: { vi: 'Đùi, mông, bắp chân – cần 1 chiếc ghế', en: 'Quads, glutes, calves – needs a chair' },
    items: [{ id: 'sumo-squat', reps: 15 }, { id: 'side-lunge', reps: 12 }, { id: 'step-up', reps: 12 }, { id: 'single-leg-bridge', reps: 10 }, { id: 'calf-raise', reps: 20 }, { id: 'wall-sit', seconds: 45 }],
  },
  {
    id: 'region-upper', region: 'upper', emoji: '🧱', level: 2, rounds: 3, rest: 30, roundRest: 60,
    title: { vi: 'Thân trên', en: 'Upper body' },
    subtitle: { vi: 'Ngực, lưng, vai, tay – cần 1 chiếc ghế', en: 'Chest, back, shoulders, arms – needs a chair' },
    items: [{ id: 'pushup', reps: 12 }, { id: 'prone-ytw', reps: 8 }, { id: 'chair-dip', reps: 10 }, { id: 'wide-pushup', reps: 10 }, { id: 'superman', reps: 12 }, { id: 'plank-shoulder-tap', reps: 16 }],
  },
  {
    id: 'region-lower', region: 'lower', emoji: '🍑', level: 1, rounds: 3, rest: 25, roundRest: 60,
    title: { vi: 'Thân dưới', en: 'Lower body' },
    subtitle: { vi: 'Mông, đùi, bắp chân – cần 1 chiếc ghế', en: 'Glutes, thighs, calves – needs a chair' },
    items: [{ id: 'squat', reps: 15 }, { id: 'reverse-lunge', reps: 12 }, { id: 'hip-thrust', reps: 12 }, { id: 'donkey-kick', reps: 12 }, { id: 'calf-raise', reps: 20 }, { id: 'glute-bridge', reps: 15 }],
  },
];

export const PROGRAM_MAP = Object.fromEntries(PROGRAMS.map((p) => [p.id, p])) as Record<string, Program>;

/** Approximate seconds needed to perform `reps` of an exercise, from its animation cycle. */
export const repSeconds = (cycle: number, reps: number) => Math.round(cycle * reps);
