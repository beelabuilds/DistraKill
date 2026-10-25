import { getFocusStats, getPendingTasks, getRelevantDua, type AppTask } from '@/services/app-context-service';

export type AssistantResult = { text: string; source: 'app' | 'provider-unavailable' };

function formatTasks(tasks: AppTask[]): string {
  if (tasks.length === 0) return "You don't have any pending tasks yet.";
  const lines = tasks.map((task, index) => `${index + 1}. ${task.title}${task.subject ? ` (${task.subject})` : ''}${task.estimatedMinutes ? ` - ${task.estimatedMinutes} min` : ''}`);
  return `You currently have ${tasks.length} pending task${tasks.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
}

export async function answerQuestion(question: string, userId?: string): Promise<AssistantResult> {
  const normalized = question.toLowerCase();
  const asksForDua = /\bdua|prayer|supplication\b/.test(normalized);
  const asksForTasks = /\btask|pending|assignment|todo|to-do\b/.test(normalized);
  const asksForFocus = /focus session|pomodoro|focus history|completed.*session|session.*completed/.test(normalized);
  const asksForPlan = /25-minute|25 minute|study plan|what should i study|plan.*session/.test(normalized);

  if (asksForDua) {
    const dua = await getRelevantDua(question);
    if (!dua) return { source: 'app', text: "I couldn't find a matching dua in your DistraKill dua collection." };
    return { source: 'app', text: [dua.title, dua.arabic, dua.transliteration ? `Transliteration: ${dua.transliteration}` : '', dua.translation ? `Translation: ${dua.translation}` : '', dua.reference ? `Source: ${dua.reference}` : ''].filter(Boolean).join('\n\n') };
  }
  if (asksForTasks || asksForPlan) {
    if (!userId) return { source: 'app', text: 'Please sign in so I can safely read your personal study tasks.' };
    const tasks = await getPendingTasks(userId);
    if (asksForTasks) return { source: 'app', text: formatTasks(tasks) };
    if (tasks.length > 0) return { source: 'app', text: `For a focused 25-minute session, start with ${tasks[0].title}${tasks[0].subject ? ` (${tasks[0].subject})` : ''}. Work for 20 minutes, then spend 5 minutes reviewing what you learned.` };
    return { source: 'app', text: 'You have no pending tasks yet. A simple 25-minute session could be: 20 minutes of one topic, followed by 5 minutes of active recall.' };
  }
  if (asksForFocus) {
    if (!userId) return { source: 'app', text: 'Please sign in so I can read your focus-session totals.' };
    const stats = await getFocusStats(userId);
    return { source: 'app', text: `You have completed ${stats.sessionCount} focus session${stats.sessionCount === 1 ? '' : 's'} for ${stats.totalMinutes} total minute${stats.totalMinutes === 1 ? '' : 's'}.` };
  }
  return { source: 'provider-unavailable', text: 'I can currently help with your DistraKill tasks, study planning, focus totals, and duas. General questions need a secure AI backend, which is not connected to this app yet.' };
}