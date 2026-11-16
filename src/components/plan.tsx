// Shared bits for the 4-week plans: the route to a plan session, its time estimate,
// and the cards the home screen shows (plan list, or the next session of the active plan).
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Plan, PLAN_MAP, PlanEntry, planEntries, planNext, planSessionsPerWeek } from '../data/plans';
import { PROGRAM_MAP } from '../data/programs';
import { applyAdjust } from '../data/progression';
import { useStore } from '../store';
import { colors, levelColor, type } from '../theme';
import { Button, Card, EmojiTile, estimateProgramSeconds, Ionicons, LevelBadge, ProgressBar } from './ui';

export const planSessionHref = (planId: string, e: PlanEntry) => `/workout/${e.programId}?plan=${planId}&session=${e.index}` as const;

/** Minutes for a plan session at the user's own level plus that week's step. */
export function useSessionMinutes() {
  const { adjust } = useStore();
  return (e: PlanEntry) => {
    const p = PROGRAM_MAP[e.programId];
    return p ? Math.round(estimateProgramSeconds(applyAdjust(p, (adjust[e.programId] ?? 0) + e.step)) / 60) : 0;
  };
}

/** A plan in a list: icon, title, goal, level and length. */
export function PlanCard({ plan }: { plan: Plan }) {
  const { t, tx } = useStore();
  const total = planEntries(plan).length;
  return (
    <Card onPress={() => router.push(`/plan/${plan.id}`)} style={st.row}>
      <EmojiTile emoji={plan.emoji} tint={levelColor(plan.level)} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={type.title} numberOfLines={1}>{tx(plan.title)}</Text>
        <Text style={type.muted} numberOfLines={2}>{tx(plan.goal)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <LevelBadge level={plan.level} />
          <Text style={[type.muted, { fontSize: 12 }]}>
            {plan.weeks.length} {t('weeks')} · {planSessionsPerWeek(plan)} {t('perWeek')} · {total} {t('sessions')}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Card>
  );
}

/** Home card for the plan the user follows: progress and a one-tap start of the next session. */
export function ActivePlanCard() {
  const { t, tx, activePlan } = useStore();
  const minutes = useSessionMinutes();
  const plan = activePlan ? PLAN_MAP[activePlan.id] : undefined;
  if (!plan || !activePlan) return null;
  const total = planEntries(plan).length;
  const next = planNext(plan, activePlan.done);
  const program = next && PROGRAM_MAP[next.programId];

  return (
    // only the header opens the plan; the Start button sits outside it (no button inside a button)
    <Card glow={colors.accent} style={{ gap: 12 }}>
      <Pressable style={st.row} onPress={() => router.push(`/plan/${plan.id}`)} accessibilityRole="button" accessibilityLabel={tx(plan.title)}>
        <EmojiTile emoji={plan.emoji} tint={levelColor(plan.level)} size={44} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.eyebrow}>{next ? `${t('week')} ${next.week + 1} · ${t('session')} ${next.day + 1}` : t('planDone')}</Text>
          <Text style={type.title} numberOfLines={1}>{tx(plan.title)}</Text>
        </View>
        <Text style={[type.number, { fontSize: 22, lineHeight: 24 }]}>{activePlan.done}/{total}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
      <ProgressBar value={activePlan.done / total} />
      {next && program ? (
        <View style={st.row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.muted, { fontSize: 12 }]}>{t('nextSession')}</Text>
            <Text style={type.body} numberOfLines={1}>{tx(program.title)} · ~{minutes(next)} {t('min')}</Text>
          </View>
          <Button label={t('start')} icon="play" compact onPress={() => router.push(planSessionHref(plan.id, next))} />
        </View>
      ) : (
        <Text style={type.muted}>{t('planDoneDesc')}</Text>
      )}
    </Card>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
