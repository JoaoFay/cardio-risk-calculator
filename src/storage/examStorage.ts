import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedExam, ExamType } from '../types';

const STORAGE_KEY = 'medcalc:exams';

async function readAll(): Promise<SavedExam[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedExam[];
  } catch {
    return [];
  }
}

async function writeAll(exams: SavedExam[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
}

export async function getAllExams(): Promise<SavedExam[]> {
  const exams = await readAll();
  return exams.sort((a, b) => b.examDate.localeCompare(a.examDate));
}

export async function saveExam(
  exam: Omit<SavedExam, 'id' | 'savedAt'>,
): Promise<SavedExam> {
  const exams = await readAll();
  const saved: SavedExam = {
    ...exam,
    id: Date.now().toString(),
    savedAt: new Date().toISOString(),
  };
  exams.push(saved);
  await writeAll(exams);
  return saved;
}

export async function updateExam(
  id: string,
  updates: Partial<Omit<SavedExam, 'id' | 'savedAt'>>,
): Promise<void> {
  const all = await readAll();
  const idx = all.findIndex(e => e.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...updates };
  await writeAll(all);
}

export async function deleteExam(id: string): Promise<void> {
  const exams = await readAll();
  await writeAll(exams.filter(e => e.id !== id));
}

export async function getLastExamByType(type: ExamType): Promise<SavedExam | null> {
  const exams = await readAll();
  const ofType = exams
    .filter(e => e.type === type)
    .sort((a, b) => b.examDate.localeCompare(a.examDate));
  return ofType[0] ?? null;
}

export async function getExamsByType(type: ExamType): Promise<SavedExam[]> {
  const exams = await readAll();
  return exams
    .filter(e => e.type === type)
    .sort((a, b) => b.examDate.localeCompare(a.examDate));
}
