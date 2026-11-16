import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, BackHandler, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { Button, Chip, ComboSteps, IconButton, Ionicons, ProgressBar, StatTile, s as ui } from '@/components/ui';
import { EXERCISE_MAP, Exercise } from '@/data/exercises';
import { Program } from '@/data/programs';
import { applyAdjust, tempoCue } from '@/data/progression';
import { cueVariants, REST_TIPS } from '@/data/voiceLines';
import { Feel, useStore } from '@/store';
import { colors, fonts, gradients, radius, type } from '@/theme';
import { speak, stopVoice, VoicePart } from '@/voice';

type Step = {
  kind: 'ready' | 'work' | 'rest';
  ex: Exercise;
  reps?: number;
  seconds?: number;
  round: number;
  workIndex: number;
};

const BODY_KG = 70;

function resolveProgram(id: string, getProgram: (id: string) => Program | undefined): Program | undefined {
  if (id.startsWith('ex-')) {
    const ex = EXERCISE_MAP[id.slice(3)];
    if (!ex) return undefined;
    return {
      id, emoji: '🎯', level: ex.level, rounds: 3, rest: 30, roundRest: 30, title: ex.name, subtitle: ex.muscles,
      items: [ex.mode === 'reps' ? { id: ex.id, reps: 10 } : { id: ex.id, seconds: 30 }],
    };
  }
  return getProgram(id);
}

const pickOne = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

function buildSteps(p: Program): Step[] {
  const steps: Step[] = [];
  const first = EXERCISE_MAP[p.items[0].id];
  steps.push({ kind: 'ready', ex: first, seconds: 5, round: 1, workIndex: 0 });
  let w = 0;
  for (let r = 1; r <= p.rounds; r++) {
    p.items.forEach((it, i) => {
      steps.push({ kind: 'work', ex: EXERCISE_MAP[it.id], reps: it.reps, seconds: it.seconds, round: r, workIndex: w++ });
      const lastInRound = i === p.items.length - 1;
      const lastOverall = lastInRound && r === p.rounds;
      if (!lastOverall) {
        const nextId = lastInRound ? p.items[0].id : p.items[i + 1].id;
        const secs = lastInRound ? p.roundRest : p.rest;
        if (secs > 0) steps.push({ kind: 'rest', ex: EXERCISE_MAP[nextId], seconds: secs, round: lastInRound ? r + 1 : r, workIndex: w });
      }
    });
  }
  return steps;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function Workout() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tx, settings, addSession, getProgram, adjust, setAdjust } = useStore();
  // progression is read once when the workout opens, so rating it at the end doesn't change it mid-screen
  const [level] = useState(() => adjust[id] ?? 0);
  const program = useMemo(() => {
    const p = resolveProgram(id, getProgram);
    return p && applyAdjust(p, level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, level]);
  const steps = useMemo(() => (program ? buildSteps(program) : []), [program]);
  const totalWork = steps.filter((s) => s.kind === 'work').length;
  const [feel, setFeel] = useState<Feel | undefined>();
  const insets = useSafeAreaInsets();

  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [reps, setReps] = useState(0);
  const [extra, setExtra] = useState(0); // +10s added to a rest
  const [segment, setSegment] = useState(0); // active move inside a combo
  const [paused, setPaused] = useState(false);
  const stats = useRef({ activeSec: 0, kcal: 0 });
  // snapshot of `stats` taken when the session ends, so the summary screen renders from state
  const [finalStats, setFinalStats] = useState<{ activeSec: number; kcal: number } | null>(null);
  const finished = finalStats !== null;
  const spokenRef = useRef(-1);
  const cuesRef = useRef(new Set<string>()); // encouragement lines already said in this step

  const step = steps[index];
  const indexRef = useRef(0);
  const elapsedRef = useRef(0);
  useLayoutEffect(() => {
    indexRef.current = index;
    elapsedRef.current = elapsed;
  }, [index, elapsed]);
  const lang = settings.lang;

  // ---------- voice + haptics ----------
  const say = useCallback(
    /** interrupt=true cuts off the current phrase; 'ifIdle' only speaks when the coach is quiet */
    (parts: VoicePart[], interrupt: boolean | 'ifIdle' = false) => {
      if (!settings.voice) return;
      speak(lang, parts, interrupt === 'ifIdle' ? 'ifIdle' : interrupt ? 'interrupt' : 'queue', settings.voiceStyle);
    },
    [settings.voice, settings.voiceStyle, lang],
  );
  /** a cue or one of its recorded variants, at random */
  const cuePart = useCallback((base: string): VoicePart => ({ key: pickOne(cueVariants(lang, base)) }), [lang]);
  const exPart = (ex: Exercise): VoicePart => ({ key: `ex_${ex.id}`, text: tx(ex.name) });
  const countPart = (n: number): VoicePart => ({ key: `count_${n}`, text: String(n) });
  const buzz = useCallback(
    (kind: 'tick' | 'step' | 'done') => {
      if (!settings.haptics) return;
      if (kind === 'tick') Haptics.selectionAsync();
      else if (kind === 'step') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [settings.haptics],
  );

  const target = (s: Step) => (s.reps ? `${s.reps} ${t('reps')}` : `${s.seconds} ${t('sec')}`);
  const targetPart = (s: Step): VoicePart =>
    s.reps ? { key: `reps_${s.reps}`, text: target(s) } : { key: `sec_${s.seconds}`, text: target(s) };

  // announce each new step
  useEffect(() => {
    if (!step || finished) return;
    spokenRef.current = -1;
    cuesRef.current = new Set();
    buzz('step');
    // the ready step's own seconds are the countdown; announce the first set's target instead
    const firstWork = steps.find((s) => s.kind === 'work');
    if (step.kind === 'ready') say([{ key: 'ready', text: t('getReady') }, exPart(step.ex), ...(firstWork ? [targetPart(firstWork)] : [])], true);
    else if (step.kind === 'work') say([cuePart('go')], true);
    else say([{ key: `rest_${step.seconds}`, text: `${t('rest')} ${step.seconds} ${t('sec')}.` }, { key: 'next' }, exPart(step.ex)], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, finished]);

  useEffect(() => () => stopVoice(), []);

  // ---------- clock ----------
  useEffect(() => {
    if (paused || finished) return;
    const h = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(h);
  }, [paused, finished]);

  const finishedRef = useRef(false);
  const savedRef = useRef(false);
  const goTo = useCallback(
    (delta: number) => {
      // a tap landing during the 700ms auto-advance must not count the last set twice
      if (finishedRef.current) return;
      const cur = steps[indexRef.current];
      const next = indexRef.current + delta;
      const elapsed = elapsedRef.current;
      if (cur?.kind === 'work') {
        stats.current.activeSec += elapsed;
        stats.current.kcal += (cur.ex.met * 3.5 * BODY_KG) / 200 * (elapsed / 60);
      }
      if (next >= steps.length) {
        finishedRef.current = true;
        setFinalStats({ ...stats.current });
        buzz('done');
        say([cuePart('done')], true);
        return;
      }
      indexRef.current = Math.max(0, next);
      elapsedRef.current = 0;
      setIndex(indexRef.current);
      setElapsed(0);
      setReps(0);
      setExtra(0);
      setSegment(0);
    },
    [steps, buzz, say, cuePart],
  );

  const duration = step?.kind === 'work' && step.reps ? undefined : (step?.seconds ?? 0) + extra;
  const remaining = duration !== undefined ? Math.max(0, duration - elapsed) : undefined;

  // auto-advance timed steps + 3-2-1 countdown
  useEffect(() => {
    if (remaining === undefined || paused || finished) return;
    const whole = Math.ceil(remaining);
    if (whole <= 3 && whole >= 1 && spokenRef.current !== whole) {
      spokenRef.current = whole;
      // "3" waits for the step announcement to finish; "2" and "1" always land on time
      say([countPart(whole)], whole === 3 ? 'ifIdle' : true);
      buzz('tick');
    }
    const once = (key: string, run: () => void) => {
      if (cuesRef.current.has(key)) return;
      cuesRef.current.add(key);
      run();
    };
    // hype during timed holds: halfway, then "10 seconds left"
    if (step?.kind === 'work' && duration !== undefined) {
      if (duration >= 20 && whole === Math.ceil(duration / 2)) once('halfway', () => say([cuePart('halfway')]));
      else if (duration >= 30 && whole === 10) once('ten_left', () => say([cuePart('ten_left')]));
    }
    // a short recovery tip in the middle of a longer rest (only if the coach is quiet)
    if (step?.kind === 'rest' && duration !== undefined && duration >= 20 && whole === Math.floor(duration / 2)) {
      once('tip', () => say([{ key: pickOne(REST_TIPS) }], 'ifIdle'));
    }
    if (remaining <= 0) goTo(1);
  }, [remaining, paused, finished, index, goTo, say, cuePart, buzz, step, duration]);

  // auto-advance rep-based steps when target reached
  useEffect(() => {
    if (step?.kind !== 'work' || !step.reps || reps < step.reps) return;
    const h = setTimeout(() => goTo(1), 700);
    return () => clearTimeout(h);
  }, [reps, step, index, goTo]);

  const onRep = useCallback(() => {
    if (step?.kind !== 'work' || !step.reps) return;
    setReps((r) => {
      const n = r + 1;
      const goal = step.reps!;
      if (n <= goal) {
        const parts = settings.countMode === 'cues' ? [] : [countPart(n)];
        if (n === goal - 1 && goal >= 4) parts.push(cuePart('last_one'));
        else if (n === goal - 3 && goal >= 8) parts.push(cuePart('three_left'));
        else if (n === Math.floor(goal / 2) && goal >= 10) parts.push(cuePart('halfway'));
        if (parts.length) say(parts);
      }
      return n;
    });
  }, [step, say, cuePart, settings.countMode]);

  // "Đếm + nhịp": an "Up!" / "Lower slowly" cue at the far end of each rep (see tempoCue)
  const tempo = useMemo(
    () => (settings.countMode === 'tempo' && step?.kind === 'work' && step.reps && !step.ex.parts && !step.ex.animApprox ? tempoCue(step.ex.anim) : null),
    [settings.countMode, step],
  );
  const onSegment = useCallback(
    (i: number) => {
      if (step?.ex.parts) setSegment(i);
      else if (tempo && i === 1) say([{ key: tempo.key }], 'ifIdle');
    },
    [step, tempo, say],
  );

  const quit = () => {
    setPaused(true);
    Alert.alert(t('quit'), t('quitMsg'), [
      { text: t('cancel'), style: 'cancel', onPress: () => setPaused(false) },
      { text: t('quit').replace('?', ''), style: 'destructive', onPress: () => { stopVoice(); router.back(); } },
    ]);
  };

  const total = finalStats?.activeSec ?? 0;
  const kcal = finalStats?.kcal ?? 0;
  const onFinish = () => {
    if (!program || savedRef.current) return; // double tap (or back + tap) would save the session twice
    savedRef.current = true;
    addSession({
      programId: program.id, title: program.title, date: new Date().toISOString(),
      durationSec: Math.round(total), kcal, exercises: totalWork, feel,
    });
    if (feel === 'easy') setAdjust(program.id, level + 1);
    else if (feel === 'hard') setAdjust(program.id, level - 1);
    router.back();
  };

  // Android back: same quit prompt mid-workout; on the results screen, save the session instead of losing it
  const backRef = useRef<() => void>(() => router.back());
  useEffect(() => {
    backRef.current = !program || !step ? () => router.back() : finished ? onFinish : quit;
  });
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      backRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);

  if (!program || !step) {
    // unknown id (e.g. an old link): never leave a blank full-screen modal with no way out
    return (
      <View style={[st.root, { paddingTop: insets.top + 40, alignItems: 'center', justifyContent: 'center', padding: 16 }]}>
        <Ionicons name="search" size={40} color={colors.muted} />
        <Text style={[ui.muted, { fontSize: 15 }]}>{t('notFound')}</Text>
        <Button label={t('close')} icon="close" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  // ---------- finished ----------
  if (finished) {
    return (
      <View style={[st.root, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 20, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'space-between' }]}>
        <LinearGradient colors={['rgba(198,244,50,0.16)', 'rgba(7,9,13,0)']} style={st.finGlow} pointerEvents="none" />
        <View style={{ alignItems: 'center', gap: 10 }}>
          <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.trophy}>
            <Ionicons name="trophy" size={58} color={colors.onAccent} />
          </LinearGradient>
          <Text style={[type.hero, { fontSize: 52, lineHeight: 54, marginTop: 8 }]}>{t('greatJob')}</Text>
          <Text style={[ui.muted, { fontSize: 15, textAlign: 'center' }]}>{t('completed')}: {tx(program.title)}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
          <StatTile value={fmt(total)} label={t('duration')} icon="time" tint={colors.accent2} />
          <StatTile value={`${Math.round(kcal)}`} label={t('kcal')} icon="flame" tint={colors.hot} />
          <StatTile value={`${totalWork}`} label={t('exercises')} icon="barbell" tint={colors.accent} />
        </View>
        <View style={{ alignSelf: 'stretch', gap: 12, alignItems: 'center' }}>
          <Text style={type.h2}>{t('howFelt')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {(['easy', 'ok', 'hard'] as const).map((f) => (
              <Chip key={f} label={t(f === 'easy' ? 'feelEasy' : f === 'ok' ? 'feelOk' : 'feelHard')} active={feel === f} onPress={() => setFeel(f)} />
            ))}
          </View>
          <Text style={[ui.muted, { minHeight: 18 }]}>
            {feel ? t(feel === 'easy' ? 'feelEasyMsg' : feel === 'ok' ? 'feelOkMsg' : 'feelHardMsg') : ' '}
          </Text>
        </View>
        <Button label={t('finish')} icon="checkmark" style={{ alignSelf: 'stretch' }} onPress={onFinish} />
      </View>
    );
  }

  const isWork = step.kind === 'work';
  const progress = isWork
    ? step.reps ? Math.min(1, reps / step.reps) : Math.min(1, elapsed / (step.seconds ?? 1))
    : 1 - (remaining ?? 0) / Math.max(1, duration ?? 1);
  const nextWork = steps.slice(index + 1).find((s) => s.kind === 'work');
  const phaseColor = isWork ? colors.accent : colors.accent2;

  return (
    <View style={[st.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      {/* top bar */}
      <View style={st.topBar}>
        <IconButton icon="close" label={t('quit')} onPress={quit} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[type.eyebrow, { textAlign: 'center', color: colors.text }]}>
            {t('round')} {step.round}/{program.rounds} · {Math.min(step.workIndex + 1, totalWork)}/{totalWork}
          </Text>
          <ProgressBar value={step.workIndex / totalWork} height={5} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* coach stage */}
      <View style={[st.stage, !isWork && { opacity: 0.85 }]}>
        <ExerciseMedia
          key={`${index}`}
          ex={step.ex}
          playing={!paused}
          speed={isWork ? 1 : 0.6}
          onCycle={isWork ? onRep : undefined}
          segments={tempo ? [tempo.at, 1] : undefined}
          onSegment={isWork && (step.ex.parts || tempo) ? onSegment : undefined}
          style={{ width: '100%', height: '100%' }}
        />
        {!isWork && (
          <LinearGradient colors={gradients.cool} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.stageTag}>
            <Text style={st.stageTagText}>{step.kind === 'rest' ? `${t('next')} →` : t('getReady')}</Text>
          </LinearGradient>
        )}
        {paused && (
          <View style={st.pausedOverlay}>
            <Ionicons name="pause-circle" size={56} color={colors.text} />
            <Text style={type.h2}>{t('paused')}</Text>
          </View>
        )}
      </View>

      {/* info */}
      <View style={{ alignItems: 'center', gap: 2, paddingHorizontal: 16 }}>
        <Text style={[type.eyebrow, { color: phaseColor }]}>
          {step.kind === 'work' ? t('followCoach') : step.kind === 'rest' ? t('rest') : t('getReady')}
        </Text>
        <Text style={[type.h1, { textAlign: 'center' }]} numberOfLines={2}>{tx(step.ex.name)}</Text>
        {step.ex.parts && <ComboSteps parts={step.ex.parts} active={isWork ? segment : undefined} center />}
        {isWork && step.reps ? (
          <Text style={st.big}>
            {Math.min(reps, step.reps)}<Text style={st.bigSub}> / {step.reps}</Text>
          </Text>
        ) : (
          <Text style={[st.big, !isWork && { color: colors.accent2 }]}>{fmt(Math.ceil(remaining ?? 0))}</Text>
        )}
        {!isWork && <Text style={ui.muted}>{target(step)}</Text>}
        {isWork && nextWork && <Text style={ui.muted}>{t('next')}: {tx(nextWork.ex.name)}</Text>}
      </View>

      <ProgressBar value={progress} height={8} colors={isWork ? gradients.brand : gradients.cool} style={{ marginHorizontal: 16 }} />

      {/* controls */}
      <View style={st.controls}>
        <IconButton icon="play-skip-back" label={t('previous')} size={56} onPress={() => goTo(-1)} disabled={index === 0} />
        <IconButton
          icon={paused ? 'play' : 'pause'}
          label={paused ? t('resume') : t('pause')}
          size={80}
          tone="accent"
          onPress={() => { setPaused((p) => !p); if (!paused) stopVoice(); }}
        />
        <IconButton icon="play-skip-forward" label={t('next')} size={56} onPress={() => goTo(1)} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16 }}>
        {step.kind === 'rest' && <Button label="+10s" icon="add" variant="ghost" style={{ flex: 1 }} onPress={() => setExtra((x) => x + 10)} />}
        {isWork && step.reps ? (
          <Button label={t('done')} icon="checkmark" style={{ flex: 1 }} onPress={() => goTo(1)} />
        ) : (
          <Button label={t('skip')} iconRight="play-forward" variant={isWork ? 'ghost' : 'primary'} style={{ flex: 1 }} onPress={() => goTo(1)} />
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  stage: { flex: 1, marginHorizontal: 16, borderRadius: 32, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  stageTag: { position: 'absolute', top: 12, left: 12, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  stageTagText: { color: colors.onAccent, fontFamily: fonts.cond, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' },
  pausedOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(7,9,13,0.65)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  big: { ...type.number, fontSize: 88, lineHeight: 92 },
  bigSub: { fontFamily: fonts.display, color: colors.muted, fontSize: 36 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 28 },
  trophy: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  finGlow: { position: 'absolute', left: 0, right: 0, top: 0, height: 360 },
});
