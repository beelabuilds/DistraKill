import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, type DocumentData } from 'firebase/firestore';

import { DUAAS, type DuaaItem } from '@/app/(app)/islamic-duaa';
import { db } from '@/config/firebase';
import { formatDateKey, getTodayKey } from '@/utils/planner-utils';

export type AppTask = {
  id: string;
  title: string;
  subject?: string;
  estimatedMinutes?: number;
  completed: boolean;
  date?: string;
  deadline?: string;
};

export type FocusStats = { sessionCount: number; totalMinutes: number };
export type ProfileContext = { name?: string; major?: string };

const getString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;
const getNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export function getTaskDateKey(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.slice(0, 10);
  if (typeof value === 'number' && value > 0) return formatDateKey(new Date(value));
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return formatDateKey(value.toDate());
  }
  return undefined;
}

export function isTaskCompleted(data: DocumentData): boolean {
  return Boolean(data.completed) || data.status === 'completed';
}

function mapTask(id: string, data: DocumentData): AppTask {
  return {
    id,
    title: getString(data.title) ?? 'Untitled study task',
    subject: getString(data.subject),
    estimatedMinutes: getNumber(data.estimatedMinutes),
    completed: isTaskCompleted(data),
    date: getTaskDateKey(data.date) ?? getTaskDateKey(data.createdAt),
    deadline: getTaskDateKey(data.deadline) ?? getTaskDateKey(data.dueDate) ?? getTaskDateKey(data.date),
  };
}

export async function getUserTasks(userId: string): Promise<AppTask[]> {
  const snapshot = await getDocs(collection(db, 'users', userId, 'tasks'));
  return snapshot.docs.map((task) => mapTask(task.id, task.data()));
}

export async function getPendingTasks(userId: string): Promise<AppTask[]> {
  return (await getUserTasks(userId)).filter((task) => !task.completed);
}

export async function getTodayTasks(userId: string): Promise<AppTask[]> {
  const tasks = await getUserTasks(userId);
  const todayKey = getTodayKey();
  const todayTasks = tasks.filter((task) => task.date === todayKey);
  console.info('[AI task context]', {
    taskCountLoaded: tasks.length,
    todayTaskCount: todayTasks.length,
    allPendingTaskCount: tasks.filter((task) => !task.completed).length,
    todayKey,
  });
  return todayTasks;
}

export async function getFocusStats(userId: string): Promise<FocusStats> {
  const raw = await AsyncStorage.getItem(`@distrakill_focus_stats_${userId}`);
  if (!raw) return { sessionCount: 0, totalMinutes: 0 };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { sessionCount: 0, totalMinutes: 0 };
    const data = parsed as Record<string, unknown>;
    return {
      sessionCount: getNumber(data.sessionCount) ?? 0,
      totalMinutes: getNumber(data.totalMinutes) ?? 0,
    };
  } catch {
    return { sessionCount: 0, totalMinutes: 0 };
  }
}

export async function getProfileContext(userId: string): Promise<ProfileContext> {
  const raw = await AsyncStorage.getItem(`@distrakill_user_profile_${userId}`);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const data = parsed as Record<string, unknown>;
    return { name: getString(data.name), major: getString(data.major) };
  } catch {
    return {};
  }
}

export async function getRelevantDua(queryText: string): Promise<DuaaItem | null> {
  const normalized = queryText.toLowerCase();
  const keywords = normalized.includes('study') || normalized.includes('exam') || normalized.includes('knowledge') || normalized.includes('forget')
    ? ['study', 'exam', 'knowledge', 'forget', 'learn']
    : normalized.includes('stress') || normalized.includes('overwhelm') || normalized.includes('anxious') || normalized.includes('worr')
      ? ['stress', 'anxiety', 'calm', 'relief', 'worry']
      : ['dua', 'prayer', 'supplication'];

  const scoreDua = (dua: DuaaItem): number => {
    const haystack = `${dua.category} ${dua.title} ${dua.translation}`.toLowerCase();
    return keywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
  };

  try {
    const snapshot = await getDocs(query(collection(db, 'duaas'), where('isActive', '==', true)));
    const cloudDuaas: DuaaItem[] = snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        category: getString(data.category) ?? 'general',
        title: getString(data.title) ?? 'Dua',
        arabic: getString(data.arabicText) ?? '',
        transliteration: getString(data.transliteration) ?? '',
        translation: getString(data.translation) ?? '',
        reference: getString(data.source) ?? '',
      };
    });
    const bestCloudDua = cloudDuaas.sort((left, right) => scoreDua(right) - scoreDua(left))[0];
    if (bestCloudDua && scoreDua(bestCloudDua) > 0) return bestCloudDua;
  } catch {
    // The bundled catalog remains available when the optional collection is unavailable.
  }

  const bestLocalDua = [...DUAAS].sort((left, right) => scoreDua(right) - scoreDua(left))[0];
  return bestLocalDua && scoreDua(bestLocalDua) > 0 ? bestLocalDua : null;
}
