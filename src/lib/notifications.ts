import * as Notifications from 'expo-notifications';

/**
 * iOS doesn't let an offline app generate and send reports in the background, so we schedule
 * local reminders. Tapping one opens the matching report, ready to share as PDF.
 */

export type ReportReminderData = { report: 'week' | 'month'; offset: number };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return req.granted;
}

/** Friday 9 PM (end of the Sat→Fri week) and the 1st of each month at 10 AM. */
export async function scheduleReportReminders(): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'تقرير الأسبوع جاهز',
      body: 'شوف ليك كام وعليك كام الأسبوع ده… ومتنساش تعمل نسخة احتياطية.',
      data: { report: 'week', offset: 0 } satisfies ReportReminderData,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 6, hour: 21, minute: 0 }, // 1 = Sunday → 6 = Friday
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'تقرير الشهر اللي فات جاهز',
      body: 'الدخل والمصاريف والضرائب والمديونيات بالتفصيل.',
      data: { report: 'month', offset: -1 } satisfies ReportReminderData,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: 1, hour: 10, minute: 0 },
  });
  return true;
}

export async function cancelReportReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function remindersScheduled(): Promise<boolean> {
  return (await Notifications.getAllScheduledNotificationsAsync()).length > 0;
}

export function parseReminderData(data: unknown): ReportReminderData | null {
  const d = data as Partial<ReportReminderData> | undefined;
  if (d && (d.report === 'week' || d.report === 'month') && typeof d.offset === 'number') {
    return { report: d.report, offset: d.offset };
  }
  return null;
}
