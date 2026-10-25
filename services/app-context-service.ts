import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, type DocumentData } from 'firebase/firestore';

import { DUAAS, type DuaaItem } from '@/app/(app)/islamic-duaa';
import { db } from '@/config/firebase';

export type AppTask = { id: string; title: string; subject?: string; estimatedMinutes?: number; completed: boolean; date?: string };
export type FocusStats = { sessionCount: number; totalMinutes: number };

const getString = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value : undefined;
const getNumber = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) ? value : undefined;

function mapTask(id: string, data: DocumentData): AppTask {
  return { id, title: getString(data.title) ?? 'Untitled study task', subject: getString(data.subject), estimatedMinutes: getNumber(data.estimatedMinutes), completed: Boolean(data.completed) || data.status === 'completed', date: getString(data.date) };
}

export async function getUserTasks(userId: string): Promise<AppTask[]> {
  const snapshot = await getDocs(collection(db, 'users', userId, 'tasks'));
  return snapshot.docs.map((task) => mapTask(task.id, task.data()));
}

export async function getPendingTasks(userId: string): Promise<AppTask[]> {
  return (await getUserTasks(userId)).filter((task) => !task.completed);
}

export async function getFocusStats(userId: string): Promise<FocusStats> {
  const raw = await AsyncStorage.getItem(`@distrakill_focus_stats_${userId}`);
  if (!raw) return { sessionCount: 0, totalMinutes: 0 };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { sessionCount: 0, totalMinutes: 0 };
    const data = parsed as Record<string, unknown>;
    return { sessionCount: getNumber(data.sessionCount) ?? 0, totalMinutes: getNumber(data.totalMinutes) ?? 0 };
  } catch { return { sessionCount: 0, totalMinutes: 0 }; }
}

export async function getRelevantDua(queryText: string): Promise<DuaaItem | null> {
  const normalized = queryText.toLowerCase();
  const categories = normalized.includes('study') || normalized.includes('exam') || normalized.includes('knowledge') ? ['knowledge'] : normalized.includes('stress') || normalized.includes('overwhelm') ? ['stress'] : normalized.includes('anxious') || normalized.includes('worr') ? ['anxiety'] : [];
  try {
    const constraints = categories.length > 0 ? [where('isActive', '==', true), where('category', 'in', categories)] : [where('isActive', '==', true)];
    const snapshot = await getDocs(query(collection(db, 'duaas'), ...constraints));
    const first = snapshot.docs[0];
    if (first) {
      const data = first.data();
      return { id: first.id, category: getString(data.category) ?? 'general', title: getString(data.title) ?? 'Dua', arabic: getString(data.arabicText) ?? '', transliteration: getString(data.transliteration) ?? '', translation: getString(data.translation) ?? '', reference: getString(data.source) ?? '' };
    }
  } catch { /* Use the bundled catalog when the optional collection is unavailable. */ }
  return DUAAS.find((dua) => categories.length === 0 || categories.includes(dua.category)) ?? null;
}