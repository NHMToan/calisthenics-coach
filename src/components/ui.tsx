import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ComponentProps, ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { EXERCISE_IMAGES } from '../data/images.generated';
import { alpha, colors, fonts, gradients, levelColor, radius, type } from '../theme';
import { useStore } from '../store';
import { Avatar } from '../avatar/Avatar';
import { ComboPart, Exercise, EXERCISE_MAP } from '../data/exercises';
import { Program } from '../data/programs';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export { Ionicons };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Springy press feedback shared by cards, buttons and chips. */
function usePressScale(to = 0.97) {
  const [scale] = useState(() => new Animated.Value(1));
  const spring = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return { scale, onPressIn: () => spring(to), onPressOut: () => spring(1) };
}

/** Fades and slides its children in on mount; `delay` staggers sections. */
export function Rise({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  const press = usePressScale(0.94);
  const fg = active ? colors.onAccent : colors.text;
  const content = (
    <>
      {icon && <Ionicons name={icon} size={15} color={fg} />}
      <Text style={[s.chipText, { color: fg }]}>{label}</Text>
    </>
  );
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={{ transform: [{ scale: press.scale }] }}
    >
      {active ? (
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.chip, { borderColor: 'transparent' }]}>
          {content}
        </LinearGradient>
      ) : (
        <View style={s.chip}>{content}</View>
      )}
    </AnimatedPressable>
  );
}

/** Level as a pill with 1–3 signal bars. */
export function LevelBadge({ level }: { level: 1 | 2 | 3 }) {
  const { t } = useStore();
  const c = levelColor(level);
  return (
    <View style={[s.badge, { backgroundColor: alpha(c, 0.14) }]}>
      <View style={s.bars}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ width: 3, height: 3 + i * 3, borderRadius: 1.5, backgroundColor: i <= level ? c : alpha(c, 0.3) }} />
        ))}
      </View>
      <Text style={[s.badgeText, { color: c }]}>{t(`level${level}` as const)}</Text>
    </View>
  );
}

/** Small neutral pill, e.g. equipment. */
export function Tag({ label, icon }: { label: string; icon?: IconName }) {
  return (
    <View style={[s.badge, { backgroundColor: colors.card2 }]}>
      {icon && <Ionicons name={icon} size={11} color={colors.muted} />}
      <Text style={[s.badgeText, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export function Card({ children, style, onPress, glow }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; glow?: string }) {
  const press = usePressScale(0.98);
  const glowStyle = glow ? { borderColor: alpha(glow, 0.45), shadowColor: glow, shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } } : null;
  if (!onPress) return <View style={[s.card, glowStyle, style]}>{children}</View>;
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      style={[s.card, glowStyle, style, { transform: [{ scale: press.scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function Button({
  label, onPress, variant = 'primary', style, icon, iconRight, compact,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
  icon?: IconName;
  iconRight?: IconName;
  compact?: boolean;
}) {
  const { settings } = useStore();
  const press = usePressScale(0.96);
  const primary = variant === 'primary';
  const fg = primary ? colors.onAccent : variant === 'danger' ? colors.danger : colors.text;
  const body = (
    <>
      {icon && <Ionicons name={icon} size={compact ? 16 : 20} color={fg} />}
      <Text style={[s.btnText, compact && { fontSize: 15 }, { color: fg }]}>{label}</Text>
      {iconRight && <Ionicons name={iconRight} size={compact ? 16 : 20} color={fg} />}
    </>
  );
  const pad = compact ? s.btnCompact : null;
  return (
    <AnimatedPressable
      onPress={() => {
        if (primary && settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[style, { transform: [{ scale: press.scale }] }]}
    >
      {primary ? (
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.btn, s.btnGlow, pad]}>
          {body}
        </LinearGradient>
      ) : (
        <View style={[s.btn, s.btnGhost, variant === 'danger' && { borderColor: alpha(colors.danger, 0.4) }, pad]}>{body}</View>
      )}
    </AnimatedPressable>
  );
}

/** Round icon-only button with a screen-reader label. */
export function IconButton({
  icon, onPress, label, size = 40, tone = 'card', disabled,
}: { icon: IconName; onPress: () => void; label: string; size?: number; tone?: 'card' | 'accent'; disabled?: boolean }) {
  const press = usePressScale(0.9);
  const accent = tone === 'accent';
  const dim = { width: size, height: size, borderRadius: size / 2 };
  const glyph = <Ionicons name={icon} size={Math.round(size * 0.45)} color={accent ? colors.onAccent : colors.text} />;
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[{ transform: [{ scale: press.scale }] }, disabled && { opacity: 0.3 }]}
    >
      {accent ? (
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.iconBtn, s.btnGlow, dim]}>{glyph}</LinearGradient>
      ) : (
        <View style={[s.iconBtn, dim]}>{glyph}</View>
      )}
    </AnimatedPressable>
  );
}

/** Section title with an optional action on the right. */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionMark} />
      <Text style={[type.h2, { flex: 1 }]}>{title}</Text>
      {action}
    </View>
  );
}

/** Big-number tile. */
export function StatTile({ value, label, icon, tint = colors.accent, style }: { value: string; label: string; icon?: IconName; tint?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.card, s.stat, style]}>
      {icon && (
        <View style={[s.statIcon, { backgroundColor: alpha(tint, 0.15) }]}>
          <Ionicons name={icon} size={16} color={tint} />
        </View>
      )}
      <Text style={[type.number, { fontSize: 34, lineHeight: 38 }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[type.muted, { fontSize: 12 }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}

/** Rounded bar with a gradient fill (0..1). */
export function ProgressBar({ value, height = 6, colors: g = gradients.brand, style }: { value: number; height?: number; colors?: readonly [string, string]; style?: StyleProp<ViewStyle> }) {
  const pct = `${Math.max(0, Math.min(1, value)) * 100}%` as const;
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: colors.card2, overflow: 'hidden' }, style]}>
      <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: pct, borderRadius: height }} />
    </View>
  );
}

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Programs (and saved custom workouts) still store an emoji as their icon key;
 * we draw a matching monochrome glyph instead so it can be tinted like the rest of the UI.
 */
const PROGRAM_ICONS: Record<string, MciName> = {
  '⭐': 'star', '🔥': 'fire', '🌱': 'sprout', '💪': 'arm-flex', '⚡': 'lightning-bolt',
  '🎯': 'target', '🏃': 'run-fast', '🧘': 'yoga', '💀': 'skull', '🧩': 'puzzle',
  '🏆': 'trophy', '🦵': 'shoe-sneaker', '🏋': 'weight-lifter', '🧱': 'dumbbell', '🍑': 'kettlebell',
};

/** Icon keys offered in the workout builder. */
export const PROGRAM_ICON_KEYS = ['⭐', '🔥', '💪', '⚡', '🎯', '🏃', '🧘', '💀'];

/** Draws a program's icon key as a tinted glyph (falls back to the raw emoji if unknown). */
export function ProgramIcon({ emoji, size, color }: { emoji: string; size: number; color: string }) {
  const name = PROGRAM_ICONS[emoji.replace(/️/g, '')];
  if (name) return <MaterialCommunityIcons name={name} size={size} color={color} />;
  return <Text style={{ fontSize: size * 0.9 }}>{emoji}</Text>;
}

/** Program icon on a tinted tile. */
export function EmojiTile({ emoji, tint = colors.accent, size = 52 }: { emoji: string; tint?: string; size?: number }) {
  return (
    <LinearGradient
      colors={[alpha(tint, 0.28), alpha(tint, 0.06)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size * 0.32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: alpha(tint, 0.25) }}
    >
      <ProgramIcon emoji={emoji} size={Math.round(size * 0.48)} color={tint} />
    </LinearGradient>
  );
}

export function ExerciseRow({ ex, detail, onPress, index }: { ex: Exercise; detail?: string; onPress?: () => void; index?: number }) {
  const { tx, t } = useStore();
  return (
    <Card onPress={onPress} style={s.row}>
      <View style={s.thumb}>
        {EXERCISE_IMAGES[ex.id] ? (
          <Image source={EXERCISE_IMAGES[ex.id].b ?? EXERCISE_IMAGES[ex.id].a} style={{ width: 88, height: 76 }} resizeMode="cover" />
        ) : (
          <Avatar anim={ex.anim} playing={false} phase={0.5} style={{ width: 88, height: 76 }} />
        )}
        {index !== undefined && (
          <View style={s.thumbIndex}>
            <Text style={s.thumbIndexText}>{index + 1}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={type.title} numberOfLines={1}>{tx(ex.name)}</Text>
        <Text style={[type.muted, detail ? { color: colors.accent, fontFamily: fonts.semi } : null]} numberOfLines={1}>{detail ?? tx(ex.muscles)}</Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <LevelBadge level={ex.level} />
          {ex.equipment !== 'none' && <Tag label={t(ex.equipment)} />}
        </View>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </Card>
  );
}

/** The moves inside a combo, with the one being performed right now highlighted. */
export function ComboSteps({ parts, active, center }: { parts: ComboPart[]; active?: number; center?: boolean }) {
  const { tx } = useStore();
  return (
    <View style={[s.steps, center && { justifyContent: 'center' }]}>
      {parts.map((p, i) => (
        <View key={i} style={s.stepWrap}>
          {i > 0 && <Ionicons name="arrow-forward" size={14} color={colors.muted} style={{ marginHorizontal: 5 }} />}
          <View style={[s.step, i === active && s.stepActive]}>
            <Text style={[s.stepText, i === active && { color: colors.onAccent }]}>{tx(p.name)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function estimateProgramSeconds(p: Program) {
  const perRound = p.items.reduce((sum, it) => {
    const ex = EXERCISE_MAP[it.id];
    return sum + (it.seconds ?? Math.round((it.reps ?? 10) * ex.anim.cycle)) + p.rest;
  }, 0);
  return perRound * p.rounds + p.roundRest * (p.rounds - 1);
}

export const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, minHeight: 40, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card },
  chipText: { fontFamily: fonts.semi, fontSize: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 1.5, height: 12 },
  badgeText: { fontFamily: fonts.cond, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border },
  btn: { flexDirection: 'row', gap: 8, borderRadius: radius.pill, minHeight: 56, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  btnCompact: { minHeight: 40, paddingHorizontal: 14 },
  btnGhost: { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card },
  btnGlow: { shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  btnText: { fontFamily: fonts.cond, fontSize: 18, letterSpacing: 1.2, textTransform: 'uppercase' },
  iconBtn: { backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' },
  section: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  sectionMark: { width: 4, height: 20, borderRadius: 2, backgroundColor: colors.accent, transform: [{ skewX: '-12deg' }] },
  stat: { flex: 1, gap: 2, padding: 14 },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, paddingRight: 14 },
  thumb: { width: 88, height: 76, borderRadius: radius.md, backgroundColor: colors.card2, overflow: 'hidden' },
  thumbIndex: { position: 'absolute', left: 6, top: 6, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: 'rgba(7,9,13,0.75)', alignItems: 'center', justifyContent: 'center' },
  thumbIndexText: { fontFamily: fonts.display, fontSize: 14, color: colors.accent },
  // legacy aliases used across screens
  rowTitle: type.title,
  muted: type.muted,
  h1: type.h1,
  h2: type.h2,
  steps: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 6 },
  stepWrap: { flexDirection: 'row', alignItems: 'center' },
  step: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.border },
  stepActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  stepText: { color: colors.text, fontSize: 13, fontFamily: fonts.semi },
});
