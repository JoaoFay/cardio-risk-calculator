import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ExamType } from '../types';
import { ReminderFrequency, MODULE_NOTIFICATION_TEXTS, updateReminder, getReminderByModule } from '../storage/reminderStorage';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function checkNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

function frequencyToDays(months: ReminderFrequency): number {
  return months * 30; // approximate
}

function buildTriggerDate(lastExamDate: string | undefined, frequencyMonths: ReminderFrequency): Date {
  const base = lastExamDate ? new Date(lastExamDate) : new Date();
  const trigger = new Date(base);
  trigger.setMonth(trigger.getMonth() + frequencyMonths);
  // If the computed date is in the past, schedule from now
  const now = new Date();
  if (trigger <= now) {
    const fromNow = new Date();
    fromNow.setDate(fromNow.getDate() + frequencyToDays(frequencyMonths));
    return fromNow;
  }
  return trigger;
}

export async function scheduleModuleReminder(
  moduleType: ExamType,
  frequencyMonths: ReminderFrequency,
  lastExamDate?: string,
): Promise<string[]> {
  // Cancel existing notifications for this module first
  await cancelModuleReminder(moduleType);

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return [];

  const triggerDate = buildTriggerDate(lastExamDate, frequencyMonths);
  const intervalDays = frequencyToDays(frequencyMonths);
  const ids: string[] = [];

  // Schedule the first notification
  const firstId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'LabIA — Lembrete de exame',
      body: MODULE_NOTIFICATION_TEXTS[moduleType],
      data: { moduleType },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
  ids.push(firstId);

  // Schedule additional reminders (up to 2 years worth of recurring reminders)
  const maxScheduled = Math.floor(730 / intervalDays); // up to 2 years
  for (let i = 1; i < maxScheduled; i++) {
    const nextDate = new Date(triggerDate);
    nextDate.setDate(nextDate.getDate() + intervalDays * i);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'LabIA — Lembrete de exame',
        body: MODULE_NOTIFICATION_TEXTS[moduleType],
        data: { moduleType },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextDate,
      },
    });
    ids.push(id);
  }

  await updateReminder(moduleType, { notificationIds: ids });
  return ids;
}

export async function cancelModuleReminder(moduleType: ExamType): Promise<void> {
  const config = await getReminderByModule(moduleType);
  if (config.notificationIds.length > 0) {
    await Promise.all(config.notificationIds.map(id => Notifications.cancelScheduledNotificationAsync(id)));
    await updateReminder(moduleType, { notificationIds: [] });
  }
}

export function getModuleFromNotificationData(data: Record<string, unknown>): ExamType | null {
  const moduleType = data?.moduleType;
  if (moduleType === 'cardio' || moduleType === 'hemograma' || moduleType === 'lipidograma' || moduleType === 'metabolico') {
    return moduleType as ExamType;
  }
  return null;
}
