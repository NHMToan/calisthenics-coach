import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { ActivePlanCard, PlanCard } from '@/components/plan';
import {
  Button, Card, EmojiTile, Ionicons, IconName, LevelBadge, Rise, SectionHeader, StatTile, estimateProgramSeconds,
} from '@/components/ui';
import { EXERCISE_MAP } from '@/data/exercises';
import { PLAN_MAP, planNext, PLANS } from '@/data/plans';
import { PROGRAM_MAP, PROGRAMS } from '@/data/programs';
import { computeStreak, useStore } from '@/store';
import { alpha, colors, fonts, gradients, levelColor, radius, type } from '@/theme';

/** cycling tints for the body-area tiles */
const REGION_TINTS = [colors.accent, colors.accent2, colors.hot, '#5B7CFF', '#FF3D6E', '#FFB13D'];

function Meta({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={st.meta}>
      <Ionicons name={icon} size={14} color={colors.accent} />
      <Text style={st.metaText}>{label}</Text>
    </View>
  );
}

export default function Home() {
  const { t, tx, history, customPrograms, activePlan } = useStore();
  const onPlan = !!(activePlan && PLAN_MAP[activePlan.id]);
  const planDone = onPlan && !planNext(PLAN_MAP[activePlan!.id], activePlan!.done);
  const streak = computeStreak(history);
  const [now] = useState(() => Date.now());
  const weekAgo = now - 7 * 864e5;
  const week = history.filter((h) => new Date(h.date).getTime() > weekAgo).length;
  const hour = new Date().getHours();
  const greeting = t(hour < 11 ? 'goodMorning' : hour < 17 ? 'goodAfternoon' : 'goodEvening');

  // Suggest: beginner program until 3 sessions, then intermediate, then HIIT
  const suggested = PROGRAM_MAP[history.length < 3 ? 'beginner-full' : history.length < 10 ? 'intermediate' : 'hiit-10'];
  const hero = EXERCISE_MAP[suggested.items[0].id];
  const mins = (p: Parameters<typeof estimateProgramSeconds>[0]) => Math.round(estimateProgramSeconds(p) / 60);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 120, gap: 16 }}
    >
      <Rise style={st.header}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={type.eyebrow}>{greeting} 👋</Text>
          <Text style={type.hero}>{t('hello')}</Text>
        </View>
      </Rise>

      <Rise delay={60} style={{ flexDirection: 'row', gap: 12 }}>
        <StatTile value={`${streak}`} label={t('streak')} icon="flame" tint={colors.hot} />
        <StatTile value={`${week}`} label={`${t('totalWorkouts')} ${t('thisWeek')}`} icon="checkmark-done" tint={colors.accent} />
      </Rise>

      <Rise delay={120}>
        <Card style={st.heroCard} glow={colors.accent}>
          {/* the stage opens the program; the Start button sits outside it (no button inside a button) */}
          <Pressable style={st.heroStage} onPress={() => router.push(`/program/${suggested.id}`)} accessibilityRole="button" accessibilityLabel={tx(suggested.title)}>
            <ExerciseMedia ex={hero} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={gradients.scrim} locations={[0.35, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.heroTag}>
              <Ionicons name="flash" size={13} color={colors.onAccent} />
              <Text style={st.heroTagText}>{t('suggested')}</Text>
            </LinearGradient>
            <View style={st.heroText}>
              <LevelBadge level={suggested.level} />
              <Text style={[type.hero, { fontSize: 38, lineHeight: 40 }]} numberOfLines={2}>{tx(suggested.title)}</Text>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <Meta icon="time-outline" label={`~${mins(suggested)} ${t('min')}`} />
                <Meta icon="barbell-outline" label={`${suggested.items.length} ${t('exercises')}`} />
                <Meta icon="repeat" label={`${suggested.rounds} ${t('rounds')}`} />
              </View>
            </View>
          </Pressable>
          <View style={{ padding: 14 }}>
            <Button label={t('start')} icon="play" onPress={() => router.push(`/workout/${suggested.id}`)} />
          </View>
        </Card>
      </Rise>

      <Rise delay={150} style={{ gap: 12 }}>
        <SectionHeader title={t('plans')} />
        {onPlan && <ActivePlanCard />}
        {/* while a plan runs only its card shows; once it's finished the others come back as next steps */}
        {(!onPlan || planDone) && PLANS.filter((p) => p.id !== activePlan?.id || !onPlan).map((p) => <PlanCard key={p.id} plan={p} />)}
      </Rise>

      <Rise delay={180} style={{ gap: 12 }}>
        <SectionHeader
          title={t('myWorkouts')}
          action={<Button label={t('create').replace('＋ ', '')} icon="add" variant="ghost" compact onPress={() => router.push('/builder')} />}
        />
        {customPrograms.map((p) => (
          <Card key={p.id} onPress={() => router.push(`/program/${p.id}`)} style={st.prog}>
            <EmojiTile emoji={p.emoji} tint={levelColor(p.level)} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={type.title} numberOfLines={1}>{tx(p.title)}</Text>
              <Text style={[type.muted, { fontSize: 12 }]}>
                {p.items.length} {t('exercises')} · ~{mins(p)} {t('min')} · {p.rounds} {t('rounds')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Card>
        ))}
      </Rise>

      <Rise delay={240} style={{ gap: 12 }}>
        <SectionHeader title={t('byRegion')} />
        <View style={st.regionGrid}>
          {PROGRAMS.filter((p) => p.region).map((p, i) => {
            const tint = REGION_TINTS[i % REGION_TINTS.length];
            return (
              <Card key={p.id} onPress={() => router.push(`/program/${p.id}`)} style={[st.regionCard, { borderColor: alpha(tint, 0.18) }]}>
                <LinearGradient colors={[alpha(tint, 0.18), 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                <EmojiTile emoji={p.emoji} tint={tint} size={44} />
                <Text style={[type.h2, { fontSize: 20, lineHeight: 22 }]} numberOfLines={1}>{t(p.region!)}</Text>
                <Text style={[type.muted, { fontSize: 12 }]} numberOfLines={1}>
                  ~{mins(p)} {t('min')} · {p.items.length} {t('exercises')}
                </Text>
              </Card>
            );
          })}
        </View>
      </Rise>

      <Rise delay={300} style={{ gap: 12 }}>
        <SectionHeader title={t('programs')} />
        {PROGRAMS.filter((p) => !p.region).map((p) => (
          <Card key={p.id} onPress={() => router.push(`/program/${p.id}`)} style={st.prog}>
            <EmojiTile emoji={p.emoji} tint={levelColor(p.level)} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={type.title} numberOfLines={1}>{tx(p.title)}</Text>
              <Text style={type.muted} numberOfLines={1}>{tx(p.subtitle)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <LevelBadge level={p.level} />
                <Text style={[type.muted, { fontSize: 12 }]}>~{mins(p)} {t('min')} · {p.rounds} {t('rounds')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Card>
        ))}
      </Rise>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 4 },
  heroCard: { padding: 0, overflow: 'hidden' },
  heroStage: { height: 320, backgroundColor: colors.card2 },
  heroTag: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  heroTagText: { fontFamily: fonts.cond, fontSize: 13, letterSpacing: 1, color: colors.onAccent, textTransform: 'uppercase' },
  heroText: { position: 'absolute', left: 16, right: 16, bottom: 14, gap: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.semi, fontSize: 13, color: colors.text },
  prog: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  regionCard: { width: '47%', flexGrow: 1, gap: 6, padding: 14, overflow: 'hidden' },
});
