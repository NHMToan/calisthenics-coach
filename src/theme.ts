// FitMotion design system: "neon sport". Deep near-black surfaces, a lime→aqua energy gradient,
// condensed italic display type for headlines and numbers, Be Vietnam Pro for everything else.
import { TextStyle } from 'react-native';

export const colors = {
  bg: '#07090D',
  card: '#11151C',
  card2: '#1A202A',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#F5F7FA',
  muted: '#8B95A3',
  accent: '#C6F432', // lime
  accent2: '#2EE6D6', // aqua
  hot: '#FF6A3D', // streaks, fire
  warn: '#FF8A4C',
  danger: '#FF5C6C',
  onAccent: '#07090D',
};

/** Gradients as [start, end] tuples (expo-linear-gradient needs ≥ 2 colors). */
export const gradients = {
  brand: ['#D8FF3E', '#2EE6D6'] as const,
  cool: ['#2EE6D6', '#5B7CFF'] as const,
  hot: ['#FFB13D', '#FF3D6E'] as const,
  /** dark scrim from transparent to the page color, for text over media */
  scrim: ['rgba(7,9,13,0)', 'rgba(7,9,13,0.92)'] as const,
};

/** Font family names, registered in app/_layout.tsx. Custom fonts carry their own weight: don't set fontWeight. */
export const fonts = {
  display: 'Display', // Barlow Condensed 800 italic: headlines, big numbers
  cond: 'Cond', // Barlow Condensed 700: labels, buttons, eyebrows
  body: 'Body',
  medium: 'BodyMedium',
  semi: 'BodySemi',
  bold: 'BodyBold',
};

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 44, lineHeight: 46, color: colors.text, textTransform: 'uppercase' },
  h1: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.text, textTransform: 'uppercase' },
  h2: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.text, textTransform: 'uppercase' },
  eyebrow: { fontFamily: fonts.cond, fontSize: 13, letterSpacing: 1.6, color: colors.muted, textTransform: 'uppercase' },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  muted: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  number: { fontFamily: fonts.display, color: colors.text, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const levelColor = (l: 1 | 2 | 3) => (l === 1 ? colors.accent : l === 2 ? colors.accent2 : colors.hot);

/** `#RRGGBB` + alpha (0..1) → `#RRGGBBAA` */
export const alpha = (hex: string, a: number) => `${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}`;
