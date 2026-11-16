import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Card, Chip, IconName, Ionicons, s as ui } from '@/components/ui';
import { EXERCISES } from '@/data/exercises';
import { EXERCISE_IMAGES } from '@/data/images.generated';
import { getExerciseVideo } from '@/data/videos';
import { ensureReminderPermission } from '@/reminders';
import { useStore } from '@/store';
import { alpha, colors, type } from '@/theme';
import { speak } from '@/voice';

const REMINDER_TIMES = [6 * 60, 7 * 60, 12 * 60, 18 * 60, 19 * 60, 21 * 60];
/** Section heading: tinted icon tile, title and an optional description. */
function Head({ icon, tint, title, desc }: { icon: IconName; tint: string; title: string; desc?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
      <View style={[st.icon, { backgroundColor: alpha(tint, 0.16) }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={ui.rowTitle}>{title}</Text>
        {desc ? <Text style={ui.muted}>{desc}</Text> : null}
      </View>
    </View>
  );
}

const hhmm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

export default function Settings() {
  const { t, settings, setSettings, clearHistory } = useStore();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 120, gap: 16 }}>
      <Text style={type.hero}>{t('settings')}</Text>

      <Card style={{ gap: 12 }}>
        <Head icon="language" tint={colors.accent2} title={t('language')} />
        <View style={st.chips}>
          <Chip label="🇻🇳 Tiếng Việt" active={settings.lang === 'vi'} onPress={() => setSettings({ lang: 'vi' })} />
          <Chip label="🇬🇧 English" active={settings.lang === 'en'} onPress={() => setSettings({ lang: 'en' })} />
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Head
          icon="videocam"
          tint="#5B7CFF"
          title={t('guide')}
          desc={`${t('guideDesc')} · ${EXERCISES.filter((e) => getExerciseVideo(e.id) || EXERCISE_IMAGES[e.id]).length}/${EXERCISES.length} ${t('videoCount')}`}
        />
        <View style={st.chips}>
          <Chip label={t('aiVideo')} active={settings.media === 'video'} onPress={() => setSettings({ media: 'video' })} />
          <Chip label={t('avatar')} active={settings.media === 'avatar'} onPress={() => setSettings({ media: 'avatar' })} />
        </View>
      </Card>

      <Card style={{ gap: 14 }}>
        <View style={st.row}>
          <Head icon="mic" tint={colors.accent} title={t('voice')} desc={t('voiceDesc')} />
          <Switch value={settings.voice} onValueChange={(v) => setSettings({ voice: v })} trackColor={{ true: colors.accent, false: colors.card2 }} thumbColor={colors.text} ios_backgroundColor={colors.card2} />
        </View>
        {settings.voice && (
          <>
            <View style={{ gap: 8 }}>
              <Text style={type.eyebrow}>{t('voiceStyle')}</Text>
              <View style={st.chips}>
                <Chip label={t('coachVoice')} active={settings.voiceStyle === 'coach'} onPress={() => setSettings({ voiceStyle: 'coach' })} />
                <Chip label={t('deviceVoice')} active={settings.voiceStyle === 'device'} onPress={() => setSettings({ voiceStyle: 'device' })} />
              </View>
              <Text style={ui.muted}>{t('voiceStyleDesc')}</Text>
            </View>
            <View style={{ gap: 8 }}>
              <Text style={type.eyebrow}>{t('countMode')}</Text>
              <View style={st.chips}>
                <Chip label={t('countEvery')} active={settings.countMode === 'count'} onPress={() => setSettings({ countMode: 'count' })} />
                <Chip label={t('countTempo')} active={settings.countMode === 'tempo'} onPress={() => setSettings({ countMode: 'tempo' })} />
                <Chip label={t('countCues')} active={settings.countMode === 'cues'} onPress={() => setSettings({ countMode: 'cues' })} />
              </View>
              <Text style={ui.muted}>
                {t(settings.countMode === 'count' ? 'countEveryDesc' : settings.countMode === 'tempo' ? 'countTempoDesc' : 'countCuesDesc')}
              </Text>
            </View>
            <Button label={t('preview').replace('▶ ', '')} icon="volume-high" variant="ghost" onPress={() => speak(settings.lang, [{ key: 'preview' }], 'interrupt', settings.voiceStyle)} />
          </>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={st.row}>
          <Head icon="notifications" tint="#FFB13D" title={t('reminder')} desc={t('reminderDesc')} />
          <Switch
            value={settings.reminder}
            trackColor={{ true: colors.accent, false: colors.card2 }} thumbColor={colors.text} ios_backgroundColor={colors.card2}
            onValueChange={async (v) => {
              if (v && !(await ensureReminderPermission().catch(() => false))) {
                Alert.alert(t('reminderDenied'), t('reminderDeniedMsg'));
                return;
              }
              setSettings({ reminder: v });
            }}
          />
        </View>
        {settings.reminder && (
          <View style={st.chips}>
            {REMINDER_TIMES.map((m) => (
              <Chip key={m} label={hhmm(m)} active={settings.reminderAt === m} onPress={() => setSettings({ reminderAt: m })} />
            ))}
          </View>
        )}
      </Card>

      <Card style={st.row}>
        <Head icon="phone-portrait" tint={colors.hot} title={t('haptics')} />
        <Switch value={settings.haptics} onValueChange={(v) => setSettings({ haptics: v })} trackColor={{ true: colors.accent, false: colors.card2 }} thumbColor={colors.text} ios_backgroundColor={colors.card2} />
      </Card>

      <Button
        label={t('resetData')}
        icon="trash-outline"
        variant="danger"
        onPress={() =>
          Alert.alert(t('resetConfirm'), '', [
            { text: t('cancel'), style: 'cancel' },
            { text: t('delete'), style: 'destructive', onPress: clearHistory },
          ])
        }
      />
      <Text style={[ui.muted, { textAlign: 'center' }]}>{t('about')}</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
