import {
    getFocusStats,
    getPendingTasks,
    getProfileContext,
    getRelevantDua,
    getTodayTasks,
    type AppTask,
} from '@/services/app-context-service';
import { generateGeneralAnswerStream, type GeneralChatHistory } from '@/services/general-ai-service';
import { getTodayKey } from '@/utils/planner-utils';

export type AssistantIntent = 'dua' | 'tasks' | 'studyPlan' | 'focus' | 'profile' | 'general';
export type AssistantResult = { text: string; source: 'app' | 'general-ai' | 'provider-unavailable' };
export type AssistantChunkHandler = (chunk: string) => void;

const normalize = (question: string) => question.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
const hasAny = (text: string, words: string[]) => words.some((word) => text.includes(word));

export function detectAssistantIntent(question: string): AssistantIntent {
  const normalized = normalize(question);
  if (hasAny(normalized, ['dua', 'prayer', 'supplication', 'stressed', 'stress', 'anxious', 'worried', 'forget what i study'])) return 'dua';
  if (hasAny(normalized, ['make a plan', 'study plan', 'what should i study', 'plan for me', 'organize my study'])) return 'studyPlan';
  if (hasAny(normalized, ['focus session', 'pomodoro', 'focus history', 'how much have i studied', 'how long did i focus', 'focus progress', 'completed sessions'])) return 'focus';
  if (hasAny(normalized, ['what is my name', 'profile name', 'show my profile'])) return 'profile';
  if (hasAny(normalized, ['task', 'pending', 'assignment', 'todo', 'to do', 'finish', 'need to complete', 'anything to study'])) return 'tasks';
  return 'general';
}

function formatDeadline(task: AppTask): string {
  return task.deadline ? ` - due ${task.deadline}` : '';
}

function formatTasks(tasks: AppTask[]): string {
  if (tasks.length === 0) return "You don't have any pending tasks right now.";
  const lines = tasks.map((task, index) => `${index + 1}. ${task.subject ? `${task.subject} - ` : ''}${task.title}${task.estimatedMinutes ? ` - ${task.estimatedMinutes} min` : ''}${formatDeadline(task)}`);
  return `You currently have ${tasks.length} pending task${tasks.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
}

function formatStudyPlan(tasks: AppTask[]): string {
  if (tasks.length === 0) return "You don't have any pending tasks right now.";
  const selected = tasks.slice(0, 3);
  const lines: string[] = ['Based on your pending tasks, I suggest:', ''];
  selected.forEach((task, index) => {
    const minutes = task.estimatedMinutes ?? 25;
    lines.push(`${index * 2 + 1}. ${task.subject ? `${task.subject} - ` : ''}${task.title} - ${minutes} min`);
    if (index < selected.length - 1) lines.push(`${index * 2 + 2}. 5 min break`);
  });
  lines.push('', 'Tasks are ordered from your planner data. No priority or deadline was invented.');
  return lines.join('\n');
}

function formatDatedStudyPlan(tasks: AppTask[]): string {
  if (tasks.length === 0) return "You don't have any pending tasks right now.";
  const today = getTodayKey();
  const lines = ['Based on your pending tasks, I suggest:', ''];
  tasks.slice(0, 5).forEach((task, index) => {
    const dateLabel = !task.date || task.date < today ? 'overdue' : task.date === today ? 'today' : `upcoming ${task.date}`;
    lines.push(`${index + 1}. ${task.subject ? `${task.subject} - ` : ''}${task.title} - ${task.estimatedMinutes ?? 25} min (${dateLabel})`);
  });
  return lines.join('\n');
}

async function answerDua(question: string): Promise<AssistantResult> {
  const dua = await getRelevantDua(question);
  if (!dua) return { source: 'app', text: "I couldn't find a matching dua in your DistraKill dua collection." };
  return {
    source: 'app',
    text: [dua.title, dua.arabic, dua.transliteration ? `Transliteration: ${dua.transliteration}` : '', dua.translation ? `Translation: ${dua.translation}` : '', dua.reference ? `Source: ${dua.reference}` : ''].filter(Boolean).join('\n\n'),
  };
}

export async function answerQuestion(question: string, userId?: string, authenticatedName?: string, generalHistory?: GeneralChatHistory, onGeneralChunk?: AssistantChunkHandler): Promise<AssistantResult> {
  const intent = detectAssistantIntent(question);
  try {
    if (intent === 'dua') return await answerDua(question);
    if (intent === 'profile') {
      if (!userId) return { source: 'app', text: 'Please sign in so I can safely read your profile.' };
      const profile = await getProfileContext(userId);
      return { source: 'app', text: profile.name ? `Your profile name is ${profile.name}.` : authenticatedName ? `Your profile name is ${authenticatedName}.` : 'I do not have a saved profile name yet.' };
    }
    if (intent === 'focus') {
      if (!userId) return { source: 'app', text: 'Please sign in so I can read your focus progress.' };
      const stats = await getFocusStats(userId);
      return { source: 'app', text: `You have completed ${stats.sessionCount} focus session${stats.sessionCount === 1 ? '' : 's'}, totaling ${stats.totalMinutes} focused minute${stats.totalMinutes === 1 ? '' : 's'}.` };
    }
    if (intent === 'tasks' || intent === 'studyPlan') {
      if (!userId) return { source: 'app', text: 'Please sign in so I can safely read your personal study tasks.' };
      const asksForToday = /\btoday\b/.test(normalize(question));
      if (intent === 'studyPlan' && asksForToday) {
        const todayTasks = (await getTodayTasks(userId)).filter((task) => !task.completed);
        if (todayTasks.length === 0) {
          const allPending = await getPendingTasks(userId);
          const otherDateMessage = allPending.length > 0
            ? ` You do have ${allPending.length} pending task${allPending.length === 1 ? '' : 's'} from other dates. I can make a plan from those if you'd like.`
            : '';
          return { source: 'app', text: `You don't have any tasks scheduled for today.${otherDateMessage}` };
        }
        return { source: 'app', text: formatStudyPlan(todayTasks) };
      }
      const tasks = await getPendingTasks(userId);
      return { source: 'app', text: intent === 'studyPlan' ? formatDatedStudyPlan(tasks) : formatTasks(tasks) };
    }
  } catch {
    return { source: 'app', text: 'I could not access that DistraKill data right now. Please check your connection and try again.' };
  }

  const answer = await generateGeneralAnswerStream(question, generalHistory, onGeneralChunk ?? (() => undefined));
  return { source: 'general-ai', text: answer };
}
