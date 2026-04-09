import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'labia:usage';

interface UsageRecord {
  date: string;  // YYYY-MM-DD
  count: number;
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function readRecord(): Promise<UsageRecord> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { date: todayISO(), count: 0 };
    const record = JSON.parse(raw) as UsageRecord;
    if (record.date !== todayISO()) {
      return { date: todayISO(), count: 0 };
    }
    return record;
  } catch {
    return { date: todayISO(), count: 0 };
  }
}

export async function getTodayCount(): Promise<number> {
  const record = await readRecord();
  return record.count;
}

export async function incrementUsage(): Promise<void> {
  const record = await readRecord();
  await AsyncStorage.setItem(KEY, JSON.stringify({ date: record.date, count: record.count + 1 }));
}
