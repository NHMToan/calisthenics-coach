// Daily workout reminder. Instead of one repeating notification we schedule the next DAYS_AHEAD days one by one,
// so a day you already trained is skipped and the text can mention your current streak.
// Re-synced whenever settings or history change.
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import type { Lang } from './i18n';

const TAG = 'fm-daily';

const TEXT = {
  vi: {
    title: '💪 Đến giờ tập rồi!',
    body: (streak: number) =>
      streak > 0 ? `Bạn đang có chuỗi ${streak} ngày. Tập 10 phút để giữ lửa nhé 🔥` : 'Chỉ 10 phút thôi. Bắt đầu chuỗi ngày tập mới nào!',
  },
  en: {
    title: '💪 Time to train!',
    body: (streak: number) =>
      streak > 0 ? `You're on a ${streak}-day streak. 10 minutes keeps it alive 🔥` : 'Just 10 minutes. Start a new streak today!',
  },
};

const CHANNEL = 'daily-reminder';
/** How far ahead to schedule; a user who doesn't open the app still gets reminders for this long. iOS caps pending at 64. */
const DAYS_AHEAD = 30;

// show the reminder even when it fires while the app is open
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
} catch {
  // not supported on this platform (web)
}

/** Android 13+ shows the permission prompt only once a channel exists, so create it first. */
async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Daily reminder', importance: AndroidImportance.DEFAULT });
}

/** Asks for permission if needed. Returns false when the user said no. */
export async function ensureReminderPermission(): Promise<boolean> {
  await ensureChannel();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

type SyncOpts = { on: boolean; at: number; lang: Lang; trainedToday: boolean; streak: number };

// syncs run one after another: two overlapping runs would both cancel, then both schedule (duplicates)
/** 'no-permission' = the reminder is on but the OS no longer allows notifications (turned off in system settings). */
export type SyncResult = 'ok' | 'no-permission';

let chain: Promise<SyncResult> = Promise.resolve('ok');
export function syncReminders(opts: SyncOpts) {
  chain = chain.then(() => sync(opts));
  return chain;
}

async function sync(opts: SyncOpts): Promise<SyncResult> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all.filter((n) => n.content.data?.tag === TAG).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    if (!opts.on || Platform.OS === 'web') return 'ok';
    if (!(await Notifications.getPermissionsAsync()).granted) return 'no-permission';
    await ensureChannel();

    const t = TEXT[opts.lang] ?? TEXT.vi;
    const now = new Date();
    for (let day = 0; day < DAYS_AHEAD; day++) {
      if (day === 0 && opts.trainedToday) continue;
      const when = new Date(now);
      when.setDate(now.getDate() + day);
      when.setHours(Math.floor(opts.at / 60), opts.at % 60, 0, 0);
      if (when.getTime() <= now.getTime() + 60_000) continue;
      // after today the streak only survives if they train, so tomorrow's text uses the streak as it would be
      const streak = day === 0 ? opts.streak : opts.trainedToday && day === 1 ? opts.streak : 0;
      await Notifications.scheduleNotificationAsync({
        content: { title: t.title, body: t.body(streak), data: { tag: TAG, url: '/' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL },
      });
    }
  } catch {
    // notifications unavailable (e.g. web, or a simulator without permission): nothing to do
  }
  return 'ok';
}
