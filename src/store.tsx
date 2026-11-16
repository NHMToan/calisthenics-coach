import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Key, Lang, translate } from './i18n';
import { EXERCISE_MAP, Text } from './data/exercises';
import { Program, PROGRAM_MAP } from './data/programs';
import { syncReminders } from './reminders';

export type Session = {
  id: string;
  programId: string;
  title: Text;
  date: string; // ISO
  durationSec: number;
  kcal: number;
  exercises: number;
  /** how hard it felt, answered on the finish screen */
  feel?: Feel;
};

export type Feel = 'easy' | 'ok' | 'hard';

export type Settings = {
  lang: Lang;
  voice: boolean;
  /** 'coach' = recorded ElevenLabs voice, 'device' = the phone's built-in voice */
  voiceStyle: 'coach' | 'device';
  /** 'count' every rep, 'tempo' count + up/down cues, 'cues' encouragement only */
  countMode: 'count' | 'tempo' | 'cues';
  haptics: boolean;
  media: 'video' | 'avatar';
  reminder: boolean;
  /** minutes after midnight */
  reminderAt: number;
};

/** A workout the user built (same shape as a built-in program). */
export type CustomProgram = Program & { custom: true };

/** Progression: -2..+4 steps of 10% on reps/seconds per program, from the "how did it feel" answers. */
export const ADJUST_MIN = -2;
export const ADJUST_MAX = 4;

type Store = {
  ready: boolean;
  settings: Settings;
  setSettings: (s: Partial<Settings>) => void;
  history: Session[];
  addSession: (s: Omit<Session, 'id'>) => void;
  clearHistory: () => void;
  customPrograms: CustomProgram[];
  saveCustom: (p: CustomProgram) => void;
  deleteCustom: (id: string) => void;
  getProgram: (id: string) => Program | undefined;
  adjust: Record<string, number>;
  setAdjust: (programId: string, value: number) => void;
  t: (k: Key) => string;
  tx: (x: Text) => string;
};

const KEY_SETTINGS = 'fm.settings.v1';
const KEY_HISTORY = 'fm.history.v1';
const KEY_CUSTOM = 'fm.custom.v1';
const KEY_ADJUST = 'fm.adjust.v1';
const DEFAULT: Settings = {
  lang: 'vi', voice: true, voiceStyle: 'coach', countMode: 'count', haptics: true, media: 'video',
  reminder: false, reminderAt: 18 * 60,
};

/** keys whose stored value couldn't be read this launch; writing them would replace the user's data with defaults */
const badKeys = new Set<string>();
const save = (key: string, value: unknown) => {
  if (badKeys.has(key)) return;
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
};

/** A saved workout can name an exercise a later app version renamed or removed: drop those items. */
const dropUnknownExercises = (p: CustomProgram): CustomProgram => ({ ...p, items: p.items.filter((it) => EXERCISE_MAP[it.id]) });

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT);
  const [history, setHistory] = useState<Session[]>([]);
  const [customPrograms, setCustom] = useState<CustomProgram[]>([]);
  const [adjust, setAdjustState] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      // each key loads on its own: one corrupted value must not stop the others from loading
      const load = async <T,>(key: string, apply: (v: T) => void) => {
        try {
          const raw = await AsyncStorage.getItem(key);
          if (raw) apply(JSON.parse(raw));
        } catch {
          // unreadable: keep the default in memory, but never write over what's stored
          badKeys.add(key);
        }
      };
      await Promise.all([
        load<Partial<Settings>>(KEY_SETTINGS, (s) => setSettingsState({ ...DEFAULT, ...s, lang: s.lang === 'en' ? 'en' : 'vi' })),
        load<Session[]>(KEY_HISTORY, (h) => Array.isArray(h) && setHistory(h)),
        load<CustomProgram[]>(KEY_CUSTOM, (c) => Array.isArray(c) && setCustom(c.map(dropUnknownExercises).filter((p) => p.items.length > 0))),
        load<Record<string, number>>(KEY_ADJUST, (a) => a && typeof a === 'object' && setAdjustState(a)),
      ]);
      setReady(true);
    })();
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      save(KEY_SETTINGS, next);
      return next;
    });
  }, []);

  const addSession = useCallback((s: Omit<Session, 'id'>) => {
    setHistory((prev) => {
      const next = [{ ...s, id: `${Date.now()}` }, ...prev];
      save(KEY_HISTORY, next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    badKeys.delete(KEY_HISTORY); // an explicit reset may replace an unreadable history
    setHistory([]);
    AsyncStorage.removeItem(KEY_HISTORY).catch(() => {});
  }, []);

  // keep the next week of reminders in line with the setting, the language and today's training
  useEffect(() => {
    if (!ready) return;
    const today = dayKey(new Date());
    syncReminders({
      on: settings.reminder, at: settings.reminderAt, lang: settings.lang,
      trainedToday: history.some((h) => dayKey(new Date(h.date)) === today), streak: computeStreak(history),
    }).then((r) => {
      // notifications were turned off in system settings: don't keep showing the reminder as on
      if (r === 'no-permission') setSettings({ reminder: false });
    });
  }, [ready, settings.reminder, settings.reminderAt, settings.lang, history, setSettings]);

  const saveCustom = useCallback((p: CustomProgram) => {
    setCustom((prev) => {
      const i = prev.findIndex((x) => x.id === p.id);
      const next = i < 0 ? [p, ...prev] : prev.map((x) => (x.id === p.id ? p : x));
      save(KEY_CUSTOM, next);
      return next;
    });
  }, []);

  const deleteCustom = useCallback((id: string) => {
    setCustom((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(KEY_CUSTOM, next);
      return next;
    });
  }, []);

  const setAdjust = useCallback((programId: string, value: number) => {
    setAdjustState((prev) => {
      const next = { ...prev, [programId]: Math.max(ADJUST_MIN, Math.min(ADJUST_MAX, value)) };
      save(KEY_ADJUST, next);
      return next;
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready, settings, setSettings, history, addSession, clearHistory,
      customPrograms, saveCustom, deleteCustom,
      getProgram: (id) => PROGRAM_MAP[id] ?? customPrograms.find((p) => p.id === id),
      adjust, setAdjust,
      t: (k) => translate(settings.lang, k),
      tx: (x) => x[settings.lang],
    }),
    [ready, settings, setSettings, history, addSession, clearHistory, customPrograms, saveCustom, deleteCustom, adjust, setAdjust],
  );

  // screens read saved workouts and progression once on open, so they wait until storage has loaded
  return <Ctx.Provider value={value}>{ready ? children : null}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}

// ---------- stats helpers ----------
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function computeStreak(history: Session[]): number {
  const days = new Set(history.map((s) => dayKey(new Date(s.date))));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // streak still alive if trained yesterday
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** minutes trained per day for the last 7 days, oldest first */
export function last7Days(history: Session[]): { label: Date; minutes: number }[] {
  const out: { label: Date; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const sec = history.filter((s) => dayKey(new Date(s.date)) === key).reduce((a, s) => a + s.durationSec, 0);
    out.push({ label: d, minutes: Math.round(sec / 60) });
  }
  return out;
}
