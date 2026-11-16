import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { Button, Card, EmojiTile, ExerciseRow, Ionicons, IconName, LevelBadge, SectionHeader, estimateProgramSeconds } from '@/components/ui';
import { EXERCISE_MAP } from '@/data/exercises';
import { applyAdjust, harderSwaps } from '@/data/progression';
import { useStore } from '@/store';
import { colors, fonts, levelColor, type } from '@/theme';

function Fact({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={st.fact}>
      <Ionicons name={icon} size={16} color={colors.accent} />
      <Text style={[type.number, { fontSize: 24, lineHeight: 26 }]}>{value}</Text>
      <Text style={[type.muted, { fontSize: 11 }]}>{label}</Text>
    </View>
  );
}

export default function ProgramDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tx, getProgram, adjust, setAdjust, history } = useStore();
  const insets = useSafeAreaInsets();
  const base = getProgram(id);
  if (!base) return null;

  const level = adjust[id] ?? 0;
  const p = applyAdjust(base, level);
  const isCustom = 'custom' in base;
  // last time this felt easy → suggest swapping in harder variants
  const lastFeel = history.find((h) => h.programId === id)?.feel;
  const swaps = lastFeel === 'easy' ? harderSwaps(p) : [];
  const hero = EXERCISE_MAP[p.items[0].id];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 150, gap: 12 }} contentInsetAdjustmentBehavior="never">
        <View style={st.hero}>
          <ExerciseMedia ex={hero} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(7,9,13,0.55)', 'rgba(7,9,13,0)']} locations={[0, 0.35]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <LinearGradient colors={['rgba(7,9,13,0)', colors.bg]} locations={[0.4, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={st.heroText}>
            <View style={st.heroEmoji}>
              <EmojiTile emoji={p.emoji} tint={levelColor(p.level)} size={48} />
            </View>
            <Text style={type.hero} numberOfLines={2}>{tx(p.title)}</Text>
            <Text style={[type.muted, { fontSize: 14 }]}>{tx(p.subtitle)}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <Card style={st.facts}>
            <Fact icon="time-outline" value={`~${Math.round(estimateProgramSeconds(p) / 60)}`} label={t('min')} />
            <View style={st.divider} />
            <Fact icon="barbell-outline" value={`${p.items.length}`} label={t('exercises')} />
            <View style={st.divider} />
            <Fact icon="repeat" value={`${p.rounds}`} label={t('rounds')} />
            <View style={st.divider} />
            <Fact icon="pause-circle-outline" value={`${p.rest}s`} label={t('rest')} />
          </Card>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LevelBadge level={p.level} />
            <View style={{ flex: 1 }} />
            <Button
              label={isCustom ? t('edit') : t('customize').replace('✎ ', '')}
              icon="create-outline"
              variant="ghost"
              compact
              onPress={() => router.push(isCustom ? `/builder?id=${id}` : `/builder?from=${id}`)}
            />
          </View>

          {level !== 0 && (
            <Card style={st.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={type.title}>
                  {t('intensity')}: <Text style={{ color: level > 0 ? colors.accent : colors.accent2 }}>{level > 0 ? '+' : ''}{level * 10}%</Text>
                </Text>
                <Text style={type.muted}>{t('intensityDesc')}</Text>
              </View>
              <Button label={t('resetLevel')} icon="refresh" variant="ghost" compact onPress={() => setAdjust(id, 0)} />
            </Card>
          )}

          {swaps.length > 0 && (
            <Card style={{ gap: 8 }} glow={colors.accent}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="rocket" size={18} color={colors.accent} />
                <Text style={type.h2}>{t('levelUp')}</Text>
              </View>
              <Text style={type.muted}>{t('levelUpDesc')}</Text>
              {swaps.map(([from, to]) => (
                <View key={from} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={type.body}>{tx(EXERCISE_MAP[from].name)}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.muted} />
                  <Text style={[type.body, { fontFamily: fonts.bold, color: colors.accent }]}>{tx(EXERCISE_MAP[to].name)}</Text>
                </View>
              ))}
              <Button label={t('makeHarder')} icon="trending-up" compact style={{ marginTop: 6 }} onPress={() => router.push(`/builder?from=${id}&harder=1`)} />
            </Card>
          )}

          <SectionHeader title={`${t('exercises')} · ${p.items.length}`} />
          {p.items.map((it, i) => {
            const ex = EXERCISE_MAP[it.id];
            const detail = it.reps ? `${it.reps} ${t('reps')}` : `${it.seconds} ${t('sec')}`;
            return <ExerciseRow key={`${it.id}-${i}`} ex={ex} index={i} detail={detail} onPress={() => router.push(`/exercise/${ex.id}`)} />;
          })}
        </View>
      </ScrollView>

      <LinearGradient colors={['rgba(7,9,13,0)', colors.bg]} locations={[0, 0.45]} style={[st.footer, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
        <Button label={t('start')} icon="play" onPress={() => router.push(`/workout/${p.id}`)} />
      </LinearGradient>
    </View>
  );
}

const st = StyleSheet.create({
  hero: { height: 380, backgroundColor: colors.card2 },
  heroEmoji: { alignSelf: 'flex-start', backgroundColor: colors.bg, borderRadius: 16 },
  heroText: { position: 'absolute', left: 16, right: 16, bottom: 6, gap: 8 },
  facts: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
  fact: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1, height: 36, backgroundColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 36 },
});
