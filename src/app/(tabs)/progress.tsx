import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, G, LinearGradient as SvgGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { Card, Ionicons, Rise, SectionHeader, StatTile } from '@/components/ui';
import { computeStreak, last7Days, useStore } from '@/store';
import { colors, fonts, gradients, radius, type } from '@/theme';

export default function Progress() {
  const { t, tx, history, settings } = useStore();
  const minutes = Math.round(history.reduce((a, s) => a + s.durationSec, 0) / 60);
  const kcal = Math.round(history.reduce((a, s) => a + s.kcal, 0));
  const days = last7Days(history);
  const max = Math.max(10, ...days.map((d) => d.minutes));
  const weekTotal = days.reduce((a, d) => a + d.minutes, 0);
  const locale = settings.lang === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 120, gap: 16 }}
    >
      <Text style={type.hero}>{t('progress')}</Text>

      <Rise style={st.grid}>
        <StatTile style={st.cell} value={`${history.length}`} label={t('totalWorkouts')} icon="barbell" tint={colors.accent} />
        <StatTile style={st.cell} value={`${minutes}`} label={t('totalMinutes')} icon="time" tint={colors.accent2} />
        <StatTile style={st.cell} value={`${kcal}`} label={t('totalKcal')} icon="nutrition" tint="#FFB13D" />
        <StatTile style={st.cell} value={`${computeStreak(history)}`} label={t('streak')} icon="flame" tint={colors.hot} />
      </Rise>

      <Rise delay={80}>
        <Card style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text style={type.eyebrow}>{t('last7')}</Text>
            <Text style={[type.number, { fontSize: 28, color: colors.accent }]}>{weekTotal}</Text>
          </View>
          <Svg viewBox="0 0 280 140" style={{ width: '100%', height: 160 }}>
            <Defs>
              <SvgGradient id="bar" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={gradients.brand[0]} />
                <Stop offset="1" stopColor={gradients.brand[1]} />
              </SvgGradient>
              <SvgGradient id="barDim" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={gradients.cool[0]} stopOpacity={0.75} />
                <Stop offset="1" stopColor={gradients.cool[1]} stopOpacity={0.55} />
              </SvgGradient>
            </Defs>
            {days.map((d, i) => {
              const h = (d.minutes / max) * 100;
              const x = 10 + i * 38;
              const isToday = i === 6;
              return (
                <G key={i}>
                  <Rect x={x} y={10} width={24} height={100} rx={12} fill={colors.card2} />
                  <Rect x={x} y={110 - h} width={24} height={Math.max(h, 0.01)} rx={12} fill={isToday ? 'url(#bar)' : 'url(#barDim)'} />
                  {d.minutes > 0 && (
                    <SvgText x={x + 12} y={104 - h} fill={colors.text} fontSize={11} fontFamily={fonts.cond} textAnchor="middle">{d.minutes}</SvgText>
                  )}
                  <SvgText x={x + 12} y={130} fill={isToday ? colors.accent : colors.muted} fontSize={10} fontFamily={fonts.semi} textAnchor="middle">
                    {d.label.toLocaleDateString(locale, { weekday: 'short' })}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </Card>
      </Rise>

      <SectionHeader title={t('history')} />
      {history.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
          <Ionicons name="trophy-outline" size={36} color={colors.muted} />
          <Text style={[type.muted, { fontSize: 15, textAlign: 'center' }]}>{t('noHistory')}</Text>
        </Card>
      ) : (
        history.slice(0, 50).map((h) => {
          const d = new Date(h.date);
          return (
            <Card key={h.id} style={st.hist}>
              <View style={st.dateBlock}>
                <Text style={[type.number, { fontSize: 24, lineHeight: 26 }]}>{d.getDate()}</Text>
                <Text style={st.dateMonth}>{d.toLocaleDateString(locale, { month: 'short' })}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={type.title} numberOfLines={1}>{tx(h.title)}</Text>
                <Text style={type.muted}>
                  {d.toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' })} · {Math.round(h.kcal)} kcal
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[type.number, { fontSize: 24, color: colors.accent }]}>{Math.max(1, Math.round(h.durationSec / 60))}</Text>
                <Text style={[type.muted, { fontSize: 11 }]}>{t('min')}</Text>
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { flexBasis: '47%', flexGrow: 1 },
  hist: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  dateBlock: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' },
  dateMonth: { fontFamily: fonts.cond, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
});
