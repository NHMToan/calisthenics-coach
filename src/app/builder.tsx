// Build or edit a custom workout. Params:
//   id    – edit that custom workout
//   from  – start from a copy of a program (built-in or custom), at its current intensity
//   harder=1 (with from) – also swap exercises for their harder variants
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Chip, ExerciseRow, IconButton, IconName, PROGRAM_ICON_KEYS as EMOJIS, ProgramIcon, SectionHeader, s as ui } from '@/components/ui';
import { Category, CATEGORIES, EXERCISE_MAP, EXERCISES } from '@/data/exercises';
import { ProgramItem } from '@/data/programs';
import { applyAdjust, clampReps, HARDER } from '@/data/progression';
import { SECOND_AMOUNTS } from '@/data/voiceLines';
import { CustomProgram, useStore } from '@/store';
import { alpha, colors, fonts, type } from '@/theme';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const REST_STEPS = [0, ...SECOND_AMOUNTS];

/** next/previous value in a list of allowed values */
const stepIn = (list: number[], v: number, dir: 1 | -1) =>
  dir > 0 ? (list.find((x) => x > v) ?? list[list.length - 1]) : ([...list].reverse().find((x) => x < v) ?? list[0]);

export default function Builder() {
  const params = useLocalSearchParams<{ id?: string; from?: string; harder?: string }>();
  const { t, tx, getProgram, adjust, saveCustom, deleteCustom, customPrograms } = useStore();
  const insets = useSafeAreaInsets();
  // only the user's own workouts are edited in place; any other id (a built-in program) is copied like `from`
  const editId = params.id && customPrograms.some((p) => p.id === params.id) ? params.id : undefined;
  const fromId = editId ? undefined : (params.from ?? params.id);

  const initial = useMemo(() => {
    if (editId) return getProgram(editId);
    if (!fromId) return undefined;
    const src = getProgram(fromId);
    if (!src) return undefined;
    const p = applyAdjust(src, adjust[src.id] ?? 0);
    const harder = params.harder === '1';
    return {
      ...p,
      title: { vi: `${p.title.vi} ${harder ? '(nâng cao)' : '(của tôi)'}`, en: `${p.title.en} ${harder ? '(harder)' : '(mine)'}` },
      items: harder ? p.items.map((it) => ({ ...it, id: HARDER[it.id] ?? it.id })) : p.items,
    };
    // read once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editing = !!editId && !!initial;
  const [name, setName] = useState(initial ? tx(initial.title) : '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? EMOJIS[0]);
  const [rounds, setRounds] = useState(initial?.rounds ?? 3);
  const [rest, setRest] = useState(initial?.rest ?? 30);
  const [roundRest, setRoundRest] = useState(initial?.roundRest ?? 60);
  const [items, setItems] = useState<ProgramItem[]>(initial?.items ?? []);
  const [picking, setPicking] = useState(false);

  const update = (i: number, patch: Partial<ProgramItem> | null) =>
    setItems((xs) => (patch === null ? xs.filter((_, j) => j !== i) : xs.map((x, j) => (j === i ? { ...x, ...patch } : x))));
  const move = (i: number, dir: -1 | 1) =>
    setItems((xs) => {
      const j = i + dir;
      if (j < 0 || j >= xs.length) return xs;
      const next = [...xs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const savedRef = useRef(false);
  const onSave = () => {
    if (savedRef.current) return; // double tap would create two copies
    if (items.length === 0) {
      Alert.alert(t('needExercise'));
      return;
    }
    const title = name.trim() || t('defaultName');
    const id = editing ? editId! : `custom-${Date.now()}`;
    const level = Math.max(...items.map((it) => EXERCISE_MAP[it.id].level)) as 1 | 2 | 3;
    const p: CustomProgram = {
      id, custom: true, emoji, level, rounds, rest, roundRest, items,
      title: { vi: title, en: title },
      subtitle: {
        vi: `${items.length} bài · ${rounds} vòng · tự tạo`,
        en: `${items.length} exercises · ${rounds} rounds · custom`,
      },
    };
    savedRef.current = true;
    saveCustom(p);
    if (editing) router.back();
    else router.replace(`/program/${id}`);
  };

  const onDelete = () =>
    Alert.alert(t('deleteWorkout'), '', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => { deleteCustom(editId!); router.dismissAll(); } },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: editing ? t('editWorkout') : t('newWorkout') }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 12 }}>
          <Text style={type.eyebrow}>{t('workoutName')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('defaultName')}
            placeholderTextColor={colors.muted}
            style={st.input}
            maxLength={40}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {EMOJIS.map((e) => (
              <Pressable key={e} onPress={() => setEmoji(e)} style={[st.emoji, emoji === e && { borderColor: colors.accent, backgroundColor: alpha(colors.accent, 0.14) }]}>
                <ProgramIcon emoji={e} size={24} color={emoji === e ? colors.accent : colors.muted} />
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={{ gap: 4 }}>
          <Stepper label={cap(t('rounds'))} value={`${rounds}`} onMinus={() => setRounds((r) => Math.max(1, r - 1))} onPlus={() => setRounds((r) => Math.min(8, r + 1))} />
          <Stepper label={t('restBetween')} value={`${rest}s`} onMinus={() => setRest((r) => stepIn(REST_STEPS, r, -1))} onPlus={() => setRest((r) => stepIn(REST_STEPS, r, 1))} />
          {rounds > 1 && (
            <Stepper label={t('restRounds')} value={`${roundRest}s`} onMinus={() => setRoundRest((r) => stepIn(REST_STEPS, r, -1))} onPlus={() => setRoundRest((r) => stepIn(REST_STEPS, r, 1))} />
          )}
        </Card>

        <SectionHeader title={`${t('exercises')} · ${items.length}`} />
        {items.length === 0 && <Text style={ui.muted}>{t('emptyBuilder')}</Text>}
        {items.map((it, i) => {
          const ex = EXERCISE_MAP[it.id];
          return (
            <Card key={`${it.id}-${i}`} style={{ gap: 8, padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={st.index}>{i + 1}</Text>
                <Text style={[ui.rowTitle, { flex: 1 }]} numberOfLines={1}>{tx(ex.name)}</Text>
                <IconBtn icon="chevron-up" label={t('moveUp')} onPress={() => move(i, -1)} disabled={i === 0} />
                <IconBtn icon="chevron-down" label={t('moveDown')} onPress={() => move(i, 1)} disabled={i === items.length - 1} />
                <IconBtn icon="close" label={t('delete')} onPress={() => update(i, null)} />
              </View>
              {it.reps !== undefined ? (
                <Stepper
                  label={cap(t('reps'))}
                  value={`${it.reps}`}
                  onMinus={() => update(i, { reps: clampReps(it.reps! - 1) })}
                  onPlus={() => update(i, { reps: clampReps(it.reps! + 1) })}
                />
              ) : (
                <Stepper
                  label={cap(t('sec'))}
                  value={`${it.seconds}s`}
                  onMinus={() => update(i, { seconds: stepIn(SECOND_AMOUNTS, it.seconds ?? 30, -1) })}
                  onPlus={() => update(i, { seconds: stepIn(SECOND_AMOUNTS, it.seconds ?? 30, 1) })}
                />
              )}
            </Card>
          );
        })}
        <Button label={t('addExercise').replace('＋ ', '')} icon="add" variant="ghost" onPress={() => setPicking(true)} />
        {editing && <Button label={t('delete')} icon="trash-outline" variant="danger" onPress={onDelete} />}
      </ScrollView>

      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 12 }}>
        <Button label={t('save')} icon="checkmark" onPress={onSave} />
      </View>

      <ExercisePicker
        visible={picking}
        onClose={() => setPicking(false)}
        onPick={(id) => {
          const ex = EXERCISE_MAP[id];
          setItems((xs) => [...xs, ex.mode === 'reps' ? { id, reps: 10 } : { id, seconds: 30 }]);
          setPicking(false);
        }}
      />
    </View>
  );
}

function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={st.stepper}>
      <Text style={[ui.muted, { flex: 1, fontSize: 15 }]}>{label}</Text>
      <IconBtn icon="remove" label={`${label} −`} onPress={onMinus} />
      <Text style={st.stepValue}>{value}</Text>
      <IconBtn icon="add" label={`${label} +`} onPress={onPlus} />
    </View>
  );
}

function IconBtn({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return <IconButton icon={icon} label={label} onPress={onPress} disabled={disabled} size={36} />;
}

function ExercisePicker({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const { t } = useStore();
  const [cat, setCat] = useState<Category | 'all'>('all');
  const list = EXERCISES.filter((e) => cat === 'all' || e.category === cat);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
          <Text style={[ui.h2, { flex: 1 }]}>{t('addExercise').replace('＋ ', '')}</Text>
          <IconButton icon="close" label={t('close')} onPress={onClose} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 6, alignItems: 'center' }}>
          <Chip label={t('all')} active={cat === 'all'} onPress={() => setCat('all')} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={t(c)} active={cat === c} onPress={() => setCat(c)} />
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 10, paddingBottom: 40 }}>
          {list.map((ex) => (
            <ExerciseRow key={ex.id} ex={ex} onPress={() => onPick(ex.id)} />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  input: { backgroundColor: colors.card2, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, color: colors.text, fontSize: 17, fontFamily: fonts.semi, borderWidth: 1, borderColor: colors.border },
  emoji: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  stepValue: { ...type.number, fontSize: 24, minWidth: 52, textAlign: 'center' },
  index: { ...type.number, fontSize: 22, color: colors.accent, minWidth: 20 },
});
