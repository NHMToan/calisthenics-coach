import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { EXERCISE_IMAGES } from '@/data/images.generated';
import { getExerciseVideo } from '@/data/videos';
import { Button, Card, Chip, ComboSteps, IconButton, IconName, Ionicons, LevelBadge, Tag, s as ui } from '@/components/ui';
import { EXERCISE_MAP } from '@/data/exercises';
import { useStore } from '@/store';
import { LinearGradient } from 'expo-linear-gradient';
import { alpha, colors, fonts, gradients, type } from '@/theme';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ex = EXERCISE_MAP[id];
  const { t, tx, settings } = useStore();
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [source, setSource] = useState<'video' | 'avatar'>();
  const [segment, setSegment] = useState(0);
  if (!ex) return null;
  const L = settings.lang;
  // the toggle only makes sense when there is AI media and a real (not borrowed) avatar animation
  const hasVideo = (!!getExerciseVideo(ex.id) || !!EXERCISE_IMAGES[ex.id]) && !ex.animApprox;
  const shown = source ?? settings.media;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 16 }} contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: tx(ex.name) }} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={st.stage}>
          <ExerciseMedia ex={ex} prefer={shown} playing={playing} speed={speed} onSegment={setSegment} style={{ width: '100%', height: '100%' }} />
        </View>
        {hasVideo && (
          <View style={[st.controls, { paddingBottom: 0 }]}>
            <Chip label={t('aiVideo')} active={shown === 'video'} onPress={() => setSource('video')} />
            <Chip label={t('avatar')} active={shown === 'avatar'} onPress={() => setSource('avatar')} />
          </View>
        )}
        <View style={st.controls}>
          <IconButton icon={playing ? 'pause' : 'play'} label={playing ? t('pause') : t('resume')} tone="accent" onPress={() => setPlaying((p) => !p)} />
          <Text style={[type.eyebrow, { marginLeft: 6, flex: 1 }]}>{t('speed')}</Text>
          {[0.5, 1, 1.5].map((v) => (
            <Chip key={v} label={`${v}x`} active={speed === v} onPress={() => setSpeed(v)} />
          ))}
        </View>
      </Card>

      <View style={{ gap: 6 }}>
        <Text style={type.hero}>{tx(ex.name)}</Text>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <LevelBadge level={ex.level} />
          <Tag label={t(ex.equipment)} icon="cube-outline" />
          <Tag label={t(ex.category)} icon="pricetag-outline" />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 }}>
          <Ionicons name="body-outline" size={15} color={colors.accent} />
          <Text style={[ui.muted, { flex: 1 }]}>{tx(ex.muscles)}</Text>
        </View>
      </View>

      {ex.parts && (
        <Card style={{ gap: 10 }} glow={colors.accent}>
          <Head icon="git-merge-outline" tint={colors.accent} title={t('sequence')} />
          <ComboSteps parts={ex.parts} active={segment} />
          <Text style={ui.muted}>{t('perRep')}</Text>
        </Card>
      )}

      <Card style={{ gap: 10 }}>
        <Head icon="list" tint={colors.accent} title={t('howTo')} />
        {ex.steps[L].map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
            <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.num}><Text style={st.numText}>{i + 1}</Text></LinearGradient>
            <Text style={st.body}>{step}</Text>
          </View>
        ))}
      </Card>

      <Card style={{ gap: 8 }}>
        <Head icon="bulb" tint={colors.accent2} title={t('tips')} />
        {ex.tips[L].map((x, i) => (
          <View key={i} style={st.bullet}>
            <Ionicons name="checkmark-circle" size={18} color={colors.accent2} style={{ marginTop: 2 }} />
            <Text style={st.body}>{x}</Text>
          </View>
        ))}
      </Card>

      <Card style={{ gap: 10, borderColor: alpha(colors.danger, 0.3) }}>
        <Head icon="warning" tint={colors.danger} title={t('mistakes')} />
        {ex.mistakes[L].map((x, i) => (
          <View key={i} style={st.bullet}>
            <Ionicons name="close-circle" size={18} color={colors.danger} style={{ marginTop: 2 }} />
            <Text style={st.body}>{x}</Text>
          </View>
        ))}
      </Card>

      <Button label={t('tryIt')} icon="play" onPress={() => router.push(`/workout/ex-${ex.id}`)} />
    </ScrollView>
  );
}

function Head({ icon, tint, title }: { icon: IconName; tint: string; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 }}>
      <View style={[st.headIcon, { backgroundColor: alpha(tint, 0.16) }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={type.h2}>{title}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  stage: { height: 320, backgroundColor: colors.card2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numText: { color: colors.onAccent, fontFamily: fonts.display, fontSize: 15 },
  body: { ...type.body, flex: 1 },
  bullet: { flexDirection: 'row', gap: 10 },
  headIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
