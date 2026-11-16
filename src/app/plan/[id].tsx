import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { planSessionHref, useSessionMinutes } from '@/components/plan';
import { Button, Card, EmojiTile, Ionicons, LevelBadge, ProgressBar, Rise, SectionHeader, Tag } from '@/components/ui';
import { PLAN_MAP, planEntries, planEquipment, planNext, planSessionsPerWeek } from '@/data/plans';
import { PROGRAM_MAP } from '@/data/programs';
import { useStore } from '@/store';
import { alpha, colors, fonts, levelColor, type } from '@/theme';

export default function PlanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tx, activePlan, startPlan, quitPlan } = useStore();
  const minutes = useSessionMinutes();
  const insets = useSafeAreaInsets();
  const plan = PLAN_MAP[id];
  if (!plan) return null;

  const entries = planEntries(plan);
  const mine = activePlan?.id === plan.id;
  const done = mine ? activePlan.done : 0;
  const next = mine ? planNext(plan, done) : null;
  const finished = mine && !next;
  const equipment = planEquipment(plan);
  const tint = levelColor(plan.level);

  const start = () => {
    const begin = () => {
      startPlan(plan.id);
      router.push(planSessionHref(plan.id, entries[0]));
    };
    if (activePlan && !mine && PLAN_MAP[activePlan.id]) {
      Alert.alert(t('switchPlan'), t('switchPlanMsg'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('startPlan'), onPress: begin },
      ]);
    } else begin();
  };

  const leave = () =>
    Alert.alert(`${t('quitPlan')}?`, t('quitPlanMsg'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('quitPlan'), style: 'destructive', onPress: quitPlan },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 150, gap: 14 }}>
        <Rise style={{ gap: 10 }}>
          <LinearGradient colors={[alpha(tint, 0.18), 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} pointerEvents="none" />
          <EmojiTile emoji={plan.emoji} tint={tint} size={56} />
          <Text style={type.hero}>{tx(plan.title)}</Text>
          <Text style={[type.body, { color: colors.muted }]}>{tx(plan.goal)}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <LevelBadge level={plan.level} />
            <Tag label={`${plan.weeks.length} ${t('weeks')}`} icon="calendar-outline" />
            <Tag label={`${planSessionsPerWeek(plan)} ${t('perWeek')}`} icon="repeat" />
            <Tag
              label={equipment.length ? `${t('needs')}: ${equipment.map((e) => t(e)).join(', ')}` : t('noEquipment')}
              icon="cube-outline"
            />
          </View>
        </Rise>

        {mine && (
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={[type.number, { fontSize: 30, lineHeight: 32 }]}>{done}/{entries.length}</Text>
              <Text style={[type.muted, { flex: 1 }]}>{t('sessions')}</Text>
              <Button label={t('quitPlan')} icon="close" variant="ghost" compact onPress={leave} />
            </View>
            <ProgressBar value={done / entries.length} />
            {finished && (
              <View style={{ gap: 4, marginTop: 4 }}>
                <Text style={type.title}>{t('planDone')}</Text>
                <Text style={type.muted}>{t('planDoneDesc')}</Text>
              </View>
            )}
          </Card>
        )}

        <Text style={[type.muted, { fontSize: 13 }]}>{t('planHow')}</Text>

        {plan.weeks.map((w, wi) => (
          <View key={wi} style={{ gap: 8 }}>
            <SectionHeader title={`${t('week')} ${wi + 1} · ${tx(w.focus)}`} />
            {w.step > 0 && <Text style={[type.muted, { fontSize: 12, marginTop: -4 }]}>+{w.step * 10}% {t('intensityUp')}</Text>}
            {entries
              .filter((e) => e.week === wi)
              .map((e) => {
                const p = PROGRAM_MAP[e.programId];
                if (!p) return null;
                const isDone = e.index < done;
                const isNext = next?.index === e.index;
                return (
                  <Pressable
                    key={e.index}
                    onPress={() => router.push(`/program/${p.id}`)}
                    accessibilityRole="button"
                    style={[st.session, isNext && { borderColor: alpha(colors.accent, 0.5), backgroundColor: alpha(colors.accent, 0.06) }]}
                  >
                    <View style={[st.dot, isDone && { backgroundColor: colors.accent, borderColor: colors.accent }, isNext && { borderColor: colors.accent }]}>
                      {isDone ? (
                        <Ionicons name="checkmark" size={16} color={colors.onAccent} />
                      ) : (
                        <Text style={[st.dotText, isNext && { color: colors.accent }]}>{e.day + 1}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[type.title, isDone && { color: colors.muted }]} numberOfLines={1}>{tx(p.title)}</Text>
                      <Text style={[type.muted, { fontSize: 12 }]}>~{minutes(e)} {t('min')} · {p.items.length} {t('exercises')}</Text>
                    </View>
                    {isNext ? (
                      <Text style={st.nextTag}>{t('nextSession')}</Text>
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                    )}
                  </Pressable>
                );
              })}
          </View>
        ))}
      </ScrollView>

      <LinearGradient colors={['rgba(7,9,13,0)', colors.bg]} locations={[0, 0.45]} style={[st.footer, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
        {next ? (
          <Button label={t('continuePlan')} icon="play" onPress={() => router.push(planSessionHref(plan.id, next))} />
        ) : finished ? (
          <Button label={t('restartPlan')} icon="refresh" onPress={() => startPlan(plan.id)} />
        ) : (
          <Button label={t('startPlan')} icon="play" onPress={start} />
        )}
      </LinearGradient>
    </View>
  );
}

const st = StyleSheet.create({
  session: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontFamily: fonts.cond, fontSize: 15, color: colors.muted },
  nextTag: { fontFamily: fonts.cond, fontSize: 12, letterSpacing: 1, color: colors.accent, textTransform: 'uppercase' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 36 },
});
