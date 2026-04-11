import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExamType } from '../types';

const STORAGE_KEY = 'labia:reminders';

export type ReminderFrequency = 3 | 6 | 12;

export interface ReminderConfig {
  moduleType: ExamType;
  enabled: boolean;
  frequencyMonths: ReminderFrequency;
  lastExamDate?: string; // 'YYYY-MM-DD'
  notificationIds: string[]; // expo notification identifiers
}

const MODULE_LABELS: Record<ExamType, string> = {
  cardio: 'Risco Cardiovascular',
  hemograma: 'Hemograma Completo',
  lipidograma: 'Lipidograma',
  metabolico: 'Perfil Metabólico',
  tireoide: 'Tireoide',
};

export const MODULE_NOTIFICATION_TEXTS: Record<ExamType, string> = {
  cardio: 'Hora de verificar seu risco cardiovascular!',
  hemograma: 'Hora de verificar seu hemograma!',
  lipidograma: 'Hora de verificar seu lipidograma!',
  metabolico: 'Hora de verificar seu perfil metabólico!',
  tireoide: 'Hora de verificar seu exame de tireoide!',
};

export { MODULE_LABELS };

const DEFAULT_CONFIGS: ReminderConfig[] = [
  { moduleType: 'cardio', enabled: false, frequencyMonths: 12, notificationIds: [] },
  { moduleType: 'hemograma', enabled: false, frequencyMonths: 6, notificationIds: [] },
  { moduleType: 'lipidograma', enabled: false, frequencyMonths: 12, notificationIds: [] },
  { moduleType: 'metabolico', enabled: false, frequencyMonths: 6, notificationIds: [] },
  { moduleType: 'tireoide', enabled: false, frequencyMonths: 6, notificationIds: [] },
];

async function readAll(): Promise<ReminderConfig[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIGS.map(c => ({ ...c }));
    const saved: ReminderConfig[] = JSON.parse(raw);
    // Merge saved with defaults in case new modules were added
    return DEFAULT_CONFIGS.map(def => {
      const found = saved.find(s => s.moduleType === def.moduleType);
      return found ?? { ...def };
    });
  } catch {
    return DEFAULT_CONFIGS.map(c => ({ ...c }));
  }
}

async function writeAll(configs: ReminderConfig[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export async function getAllReminders(): Promise<ReminderConfig[]> {
  return readAll();
}

export async function getReminderByModule(moduleType: ExamType): Promise<ReminderConfig> {
  const all = await readAll();
  return all.find(c => c.moduleType === moduleType) ?? { moduleType, enabled: false, frequencyMonths: 6, notificationIds: [] };
}

export async function updateReminder(
  moduleType: ExamType,
  updates: Partial<Omit<ReminderConfig, 'moduleType'>>,
): Promise<ReminderConfig> {
  const all = await readAll();
  const idx = all.findIndex(c => c.moduleType === moduleType);
  if (idx === -1) {
    const newConfig: ReminderConfig = { moduleType, enabled: false, frequencyMonths: 6, notificationIds: [], ...updates };
    all.push(newConfig);
    await writeAll(all);
    return newConfig;
  }
  all[idx] = { ...all[idx], ...updates };
  await writeAll(all);
  return all[idx];
}
