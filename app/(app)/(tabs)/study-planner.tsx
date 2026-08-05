import '@/config/runtime-polyfills';
import { Ionicons } from '@expo/vector-icons';
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
} from 'firebase/ai';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import { db } from '@/config/firebase';
import aiFirebaseApp from '@/config/firebase-ai';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';

type TaskType =
  | 'quiz'
  | 'assignment'
  | 'exam'
  | 'report'
  | 'project'
  | 'presentation'
  | 'reading'
  | 'revision'
  | 'lab'
  | 'other';

type TaskPriority = 'high' | 'medium' | 'low';

type StudyItemKind = 'task' | 'session';

type StudyTask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;

  // New study-task information
  kind?: StudyItemKind | null;
  subject?: string | null;
  taskType?: TaskType | null;
  deadlineDate?: string | null;
  deadlineTime?: string | null;
  estimatedMinutes?: number | null;
  priority?: TaskPriority | null;
  preferredStartTime?: string | null;
  preferredEndTime?: string | null;
  source?: 'manual' | 'ai' | null;

  // Existing fields kept for old tasks and scheduled sessions
  date?: string | number | null;
  dueDate?: string | number | null;
  startTime?: string | null;
  endTime?: string | null;
};

type TaskFormState = {
  title: string;

  // New task fields
  subject: string;
  taskType: TaskType;
  deadlineDate: string;
  deadlineTime: string;
  estimatedMinutes: number;
  priority: TaskPriority;
  preferredStartTime: string;
  preferredEndTime: string;

  // Temporary legacy fields, removed after the new form works
  date: string;
  startTime: string;
  endTime: string;
};
type TaskDropdown =
  | 'taskType'
  | 'estimatedMinutes'
  | 'priority'
  | 'deadlineTime'
  | 'preferredStartTime'
  | 'preferredEndTime'
  | null;
type TaskAction = 'toggleComplete' | 'edit' | 'delete';
type PickerMode = 'date' | 'startTime' | 'endTime' | null;
type PlanningMode = 'single-day' | 'weekly';
type PickerTarget = 'task-form' | 'ai-study-date' | 'ai-start-date' | 'ai-end-date' | 'ai-edit-date' | 'ai-edit-start' | 'ai-edit-end';

type AIStudyFormState = {
  subjectsInput: string;
  studyDate: string;
  startDate: string;
  endDate: string;
  studyDays: number[];
  startTime: string;
  endTime: string;
  sessionLength: number;
  instructions: string;
};

type PlannedSession = {
  id: string;
  title: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  included: boolean;
};

type AIPlanPayload = {
  sessions: {
    title: string;
    subject: string;
    date: string;
    startTime: string;
    endTime: string;
  }[];
};

type AIValidationResult = {
  sessions: AIPlanPayload['sessions'];
  rejectedCount: number;
  rejectionReason?: string;
};

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR = 20;
const HOUR_SLOT_COUNT = TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1;
const DEFAULT_START_TIME = '08:00';
const DEFAULT_END_TIME = '08:45';
const TIME_STEP_MINUTES = 15;
const TIME_START_MINUTES = 6 * 60;
const TIME_END_MINUTES = 23 * 60 + 45;
const DEFAULT_AI_SESSION_LENGTH = 45;
const AI_MODEL = getGenerativeModel(getAI(aiFirebaseApp, { backend: new GoogleAIBackend() }), {
model: 'gemini-3.5-flash-lite',
}, {
  timeout: 180000,
});

const TASK_TYPE_OPTIONS: {
  value: TaskType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'quiz', label: 'Quiz', icon: 'help-circle-outline' },
  { value: 'assignment', label: 'Assignment', icon: 'document-text-outline' },
  { value: 'exam', label: 'Exam', icon: 'school-outline' },
  { value: 'report', label: 'Report', icon: 'reader-outline' },
  { value: 'project', label: 'Project', icon: 'folder-open-outline' },
  { value: 'presentation', label: 'Presentation', icon: 'easel-outline' },
  { value: 'reading', label: 'Reading', icon: 'book-outline' },
  { value: 'revision', label: 'Revision', icon: 'refresh-outline' },
  { value: 'lab', label: 'Lab Work', icon: 'flask-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const ESTIMATED_TIME_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 360, label: '6 hours' },
  { value: 480, label: '8 hours' },
];

const PRIORITY_OPTIONS: {
  value: TaskPriority;
  label: string;
}[] = [
  { value: 'high', label: 'High priority' },
  { value: 'medium', label: 'Medium priority' },
  { value: 'low', label: 'Low priority' },
];
const AI_DAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const AI_SESSION_LENGTH_OPTIONS = [30, 45, 60, 90];

const LIGHT_TASK_PALETTES = [
  { background: '#EAF4FF', border: '#CFE2F6', accent: '#7EADE0' },
  { background: '#EAF7F1', border: '#CDE9DB', accent: '#70B895' },
  { background: '#FFF8DF', border: '#F0E3AE', accent: '#D1B458' },
  { background: '#F2ECFF', border: '#D8CCFB', accent: '#9E85E8' },
];

const DARK_TASK_PALETTES = [
  { background: 'rgba(126, 173, 224, 0.18)', border: 'rgba(126, 173, 224, 0.32)', accent: '#BBD8F7' },
  { background: 'rgba(112, 184, 149, 0.18)', border: 'rgba(112, 184, 149, 0.30)', accent: '#B6E1CD' },
  { background: 'rgba(209, 180, 88, 0.18)', border: 'rgba(209, 180, 88, 0.30)', accent: '#F2DFA3' },
  { background: 'rgba(158, 133, 232, 0.16)', border: 'rgba(158, 133, 232, 0.30)', accent: '#D0C1FF' },
];

const TIME_OPTIONS = Array.from(
  { length: Math.floor((TIME_END_MINUTES - TIME_START_MINUTES) / TIME_STEP_MINUTES) + 1 },
  (_, index) => TIME_START_MINUTES + index * TIME_STEP_MINUTES,
).map((minutes) => ({
  value: minutesToTimeString(minutes),
  label: formatTimeDisplay(minutesToTimeString(minutes)),
}));

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function sameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isValidDateInput(value: string) {
  return parseDateInput(value) !== null;
}

function normalizeSubject(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeSubjectsFromInput(subjectsInput: string) {
  return subjectsInput
    .split(',')
    .map((subject) => subject.trim())
    .filter(Boolean);
}

function stripMarkdownCodeFences(rawValue: string) {
  return rawValue
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();
}

function extractBalancedJsonCandidate(rawValue: string) {
  const startIndex = rawValue.search(/[\[{]/);

  if (startIndex === -1) {
    return null;
  }

  const stack: string[] = [];

  for (let index = startIndex; index < rawValue.length; index += 1) {
    const character = rawValue[index];

    if (character === '{' || character === '[') {
      stack.push(character);
    } else if (character === '}' || character === ']') {
      const lastOpening = stack.pop();

      if (!lastOpening) {
        return null;
      }

      const isMatchingPair = (lastOpening === '{' && character === '}') || (lastOpening === '[' && character === ']');

      if (!isMatchingPair) {
        return null;
      }

      if (stack.length === 0) {
        return rawValue.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function parseAiResponsePayload(rawValue: string): AIPlanPayload | null {
  const cleanedValue = stripMarkdownCodeFences(rawValue);
  const candidatesToTry = [cleanedValue, extractBalancedJsonCandidate(cleanedValue)].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidatesToTry) {
    try {
      const parsedValue = JSON.parse(candidate) as unknown;

      if (Array.isArray(parsedValue)) {
        return { sessions: parsedValue as AIPlanPayload['sessions'] };
      }

      if (parsedValue && typeof parsedValue === 'object') {
        const objectValue = parsedValue as { sessions?: unknown; plan?: unknown };

        if (Array.isArray(objectValue.sessions)) {
          return { sessions: objectValue.sessions as AIPlanPayload['sessions'] };
        }

        if (Array.isArray(objectValue.plan)) {
          return { sessions: objectValue.plan as AIPlanPayload['sessions'] };
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('AI planner JSON parse attempt failed', error);
      }
    }
  }

  return null;
}

function getPlannedSessionId(session: AIPlanPayload['sessions'][number], index: number) {
  return `${session.date}-${session.startTime}-${session.endTime}-${index}`;
}

function getPlanningDateBounds(mode: PlanningMode, form: AIStudyFormState) {
  if (mode === 'single-day') {
    const studyDate = parseDateInput(form.studyDate);
    return {
      startDate: studyDate,
      endDate: studyDate,
    };
  }

  return {
    startDate: parseDateInput(form.startDate),
    endDate: parseDateInput(form.endDate),
  };
}

function buildPlanningPrompt(
  mode: PlanningMode,
  form: AIStudyFormState,
  pendingTasks: StudyTask[],
) {
  const subjects = Array.from(
    new Set(
      pendingTasks
        .map((task) => task.subject?.trim())
        .filter(
          (subject): subject is string =>
            Boolean(subject),
        ),
    ),
  );

  const taskDetails = pendingTasks.map((task) => ({
    taskId: task.id,
    title: task.title,
    subject: task.subject ?? 'General study',
    taskType: task.taskType ?? 'other',
    deadlineDate:
      task.deadlineDate ?? 'No deadline date',
    deadlineTime:
      task.deadlineTime ?? '23:45',
    estimatedMinutes:
      task.estimatedMinutes ?? 60,
    priority:
      task.priority ?? 'medium',
    preferredStartTime:
      task.preferredStartTime ?? form.startTime,
    preferredEndTime:
      task.preferredEndTime ?? form.endTime,
  }));

  const baseStructure =
    '{"sessions":[{"title":"Machine Learning Report","subject":"Machine Learning","date":"2026-08-05","startTime":"16:00","endTime":"16:45"}]}';

  const sharedInstructions = [
    'You are a study scheduling assistant.',
    'Create study sessions only for the saved pending tasks provided below.',
    'Return JSON only. Do not include Markdown, code fences, notes, or explanations.',
    `Required JSON structure: ${baseStructure}`,
    `Saved pending tasks: ${JSON.stringify(taskDetails, null, 2)}`,
    `Use only these subjects: ${subjects.join(', ')}`,
    'Use the exact saved task title for each generated session title.',
    'Use the exact saved subject for each generated session subject.',
    'Do not invent new tasks, titles, or subjects.',
    'Give earlier deadlines and high-priority tasks more attention.',
    'Split larger estimated study times across multiple sessions when necessary.',
    'Do not schedule a task after its deadline.',
    'Avoid overlapping study sessions.',
    'Keep reasonable breaks between sessions.',
    'Respect each task preferred study window when possible.',
    `Each study session should normally be ${form.sessionLength} minutes.`,
  ];

  if (mode === 'single-day') {
    return [
      ...sharedInstructions,
      'Create a single-day study schedule.',
      `Use exactly this study date: ${form.studyDate}`,
      `All sessions must stay between ${form.startTime} and ${form.endTime}.`,
      form.instructions
        ? `Extra guidance: ${form.instructions}`
        : 'Extra guidance: create a practical and balanced schedule.',
    ].join('\n');
  }

  const selectedDays = form.studyDays
    .map(
      (dayValue) =>
        AI_DAY_OPTIONS.find(
          (option) => option.value === dayValue,
        )?.label,
    )
    .filter(Boolean)
    .join(', ');

  return [
    ...sharedInstructions,
    'Create a weekly study schedule.',
    `Use dates from ${form.startDate} to ${form.endDate}.`,
    `Use only these weekdays: ${selectedDays || 'Mon, Tue, Wed, Thu, Fri'}.`,
    `Each day's sessions must stay between ${form.startTime} and ${form.endTime}.`,
    'Distribute the estimated study time across the available days.',
    form.instructions
      ? `Extra guidance: ${form.instructions}`
      : 'Extra guidance: create a practical and balanced weekly schedule.',
  ].join('\n');
}

function validateGeneratedSessions(mode: PlanningMode, form: AIStudyFormState, rawSessions: AIPlanPayload['sessions']): AIValidationResult {
  const requestedSubjects = normalizeSubjectsFromInput(form.subjectsInput);
  const normalizedSubjectSet = new Set(requestedSubjects.map(normalizeSubject));
  const validSessions: AIPlanPayload['sessions'] = [];
  let rejectedCount = 0;
  let rejectionReason = '';
  const seenWindows = new Set<string>();
  const parsedStudyDate = parseDateInput(form.studyDate);
  const { startDate, endDate } = getPlanningDateBounds(mode, form);
  const selectedDays = new Set(form.studyDays);
  const normalizedStartTime = normalizeTimeInput(form.startTime);
  const normalizedEndTime = normalizeTimeInput(form.endTime);
  const minStartMinutes = parseTimeToMinutes(normalizedStartTime || form.startTime);
  const maxEndMinutes = parseTimeToMinutes(normalizedEndTime || form.endTime);

  const iterateSessions = Array.isArray(rawSessions) ? rawSessions : [];

  for (const session of iterateSessions) {
    const trimmedTitle = typeof session?.title === 'string' ? session.title.trim() : '';
    const trimmedSubject = typeof session?.subject === 'string' ? session.subject.trim() : '';
    const normalizedSessionDate = typeof session?.date === 'string' ? parseDateInput(session.date) : null;
    const normalizedSessionStart = typeof session?.startTime === 'string' ? normalizeTimeInput(session.startTime) : '';
    const normalizedSessionEnd = typeof session?.endTime === 'string' ? normalizeTimeInput(session.endTime) : '';
    const startMinutes = normalizedSessionStart ? parseTimeToMinutes(normalizedSessionStart) : null;
    const endMinutes = normalizedSessionEnd ? parseTimeToMinutes(normalizedSessionEnd) : null;
    let isValid = true;

    if (!trimmedTitle || !trimmedSubject || !normalizedSessionDate || !normalizedSessionStart || !normalizedSessionEnd) {
      isValid = false;
    }

    if (isValid && !normalizedSubjectSet.has(normalizeSubject(trimmedSubject))) {
      isValid = false;
    }

    if (isValid && (startMinutes === null || endMinutes === null || endMinutes <= startMinutes)) {
      isValid = false;
    }

    if (isValid && (startMinutes === null || endMinutes === null || startMinutes < TIME_START_MINUTES || endMinutes > TIME_END_MINUTES)) {
      isValid = false;
    }

    if (isValid && minStartMinutes !== null && maxEndMinutes !== null) {
      if (startMinutes === null || endMinutes === null || startMinutes < minStartMinutes || endMinutes > maxEndMinutes) {
        isValid = false;
      }
    }

  if (isValid && mode === 'single-day') {
  if (
    !normalizedSessionDate ||
    !parsedStudyDate ||
    !sameDay(normalizedSessionDate, parsedStudyDate)
  ) {
    isValid = false;
  }
}

if (isValid && mode === 'weekly') {
  if (!normalizedSessionDate || !startDate || !endDate) {
    isValid = false;
  } else if (
    normalizedSessionDate < startDate ||
    normalizedSessionDate > endDate ||
    !selectedDays.has(normalizedSessionDate.getDay())
  ) {
    isValid = false;
  }
}

if (isValid && normalizedSessionDate) {
  const windowKey =
    `${formatDateInput(normalizedSessionDate)}-` +
    `${normalizedSessionStart}-` +
    `${normalizedSessionEnd}`;

  if (seenWindows.has(windowKey)) {
    isValid = false;
  } else {
    seenWindows.add(windowKey);

    validSessions.push({
      title: trimmedTitle,
      subject: trimmedSubject,
      date: formatDateInput(normalizedSessionDate),
      startTime: normalizedSessionStart,
      endTime: normalizedSessionEnd,
    });
  }
} else if (isValid) {
  isValid = false;
}

    if (!isValid) {
      rejectedCount += 1;
    }
  }

  if (validSessions.length === 0 && rejectedCount > 0) {
    if (!requestedSubjects.length) {
      rejectionReason = 'No valid sessions matched your selected days and times.';
    } else if (mode === 'single-day') {
      rejectionReason = 'No valid sessions matched your selected days and times.';
    } else {
      rejectionReason = 'No valid sessions matched your selected days and times.';
    }
  }

  return {
    sessions: validSessions,
    rejectedCount,
    rejectionReason: rejectionReason || undefined,
  };
}

function getAiServiceErrorMessage(error: unknown) {
  const errorCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error
      ? String(
          (error as { code?: string }).code ?? '',
        )
      : '';

  const errorMessage =
    typeof error === 'object' &&
    error !== null &&
    'message' in error
      ? String(
          (error as { message?: string }).message ??
            '',
        )
      : String(error);

  const fullError =
    [errorCode, errorMessage]
      .filter(Boolean)
      .join(' - ');

  const shortError =
    fullError.length > 260
      ? fullError.slice(0, 260) + '...'
      : fullError;

  if (
    /app.?check|unauthenticated|unauthorized|forbidden|permission|401|403/i.test(
      fullError,
    )
  ) {
    return (
      'Firebase App Check blocked the request. ' +
      shortError
    );
  }

  if (
    /api.?not.?enabled|api-not-enabled/i.test(
      fullError,
    )
  ) {
    return (
      'Firebase AI Logic API is not enabled. ' +
      shortError
    );
  }

  if (
    /model.*not.*found|not found|404/i.test(
      fullError,
    )
  ) {
    return (
      'The selected Gemini model is unavailable. ' +
      shortError
    );
  }

  if (
    /quota|rate.?limit|resource-exhausted|429/i.test(
      fullError,
    )
  ) {
    return (
      'Firebase AI quota was exceeded. ' +
      shortError
    );
  }

  if (
    /timeout|deadline-exceeded/i.test(fullError)
  ) {
    return (
      'The AI request took too long. ' +
      shortError
    );
  }

  if (
    /network|connect|fetch|request-error|response-error/i.test(
      fullError,
    )
  ) {
    return (
      'AI connection error: ' +
      (shortError || 'Unknown connection error')
    );
  }

  return (
    'AI request failed: ' +
    (shortError || 'Unknown error')
  );
}

function parseDateInput(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    year < 1000 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function getStoredTaskDate(task: StudyTask) {
  const rawValue = task.date ?? task.dueDate ?? null;

  if (typeof rawValue === 'number') {
    const parsed = new Date(rawValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof rawValue === 'string') {
    return parseDateInput(rawValue);
  }

  return null;
}

function formatWeekdayDate(date: Date) {
  return String(date.getDate()).padStart(2, '0');
}

function formatLongDay(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatReadableDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatMonthLabel(date: Date) {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatAiFriendlyDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getAiDefaultForm(date: Date): AIStudyFormState {
  return {
    subjectsInput: '',
    studyDate: formatDateInput(date),
    studyDays: [1, 2, 3, 4, 5],
    startDate: formatDateInput(date),
    endDate: formatDateInput(addDays(date, 6)),
    startTime: '16:00',
    endTime: '17:00',
    sessionLength: DEFAULT_AI_SESSION_LENGTH,
    instructions: '',
  };
}

function isSameMonth(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth()
  );
}

function getDaysInMonthGrid(monthDate: Date) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = addDays(firstOfMonth, -startOffset);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function minutesToTimeString(totalMinutes: number) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const hours = String(Math.floor(clamped / 60)).padStart(2, '0');
  const minutes = String(clamped % 60).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function addMinutesToTime(timeValue: string, minutesToAdd: number) {
  const minutes = parseTimeToMinutes(timeValue);

  if (minutes === null) {
    return null;
  }

  return minutesToTimeString(minutes + minutesToAdd);
}

function formatTimeDisplay(value: string) {
  const minutes = parseTimeToMinutes(value);

  if (minutes === null) {
    return value;
  }

  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function getDefaultEndTime(startTime: string) {
  const target = addMinutesToTime(startTime, 45);

  if (target) {
    const targetMinutes = parseTimeToMinutes(target);

    if (targetMinutes !== null && targetMinutes <= TIME_END_MINUTES) {
      return target;
    }
  }

  const startMinutes = parseTimeToMinutes(startTime);

  if (startMinutes === null) {
    return DEFAULT_END_TIME;
  }

  const fallback = TIME_OPTIONS.find((option) => {
    const optionMinutes = parseTimeToMinutes(option.value);
    return optionMinutes !== null && optionMinutes > startMinutes;
  });

  return fallback?.value ?? '';
}

function getTimeOptionsAfter(startTime: string) {
  const startMinutes = parseTimeToMinutes(startTime);

  if (startMinutes === null) {
    return TIME_OPTIONS;
  }

  return TIME_OPTIONS.filter((option) => {
    const optionMinutes = parseTimeToMinutes(option.value);
    return optionMinutes !== null && optionMinutes > startMinutes;
  });
}

function getTaskFormDefaults(
  date: Date,
  task?: StudyTask | null,
): TaskFormState {
  const storedTaskDate = task ? getStoredTaskDate(task) : null;

  const legacyStartTime =
    task?.startTime &&
    parseTimeToMinutes(task.startTime) !== null
      ? task.startTime
      : DEFAULT_START_TIME;

  const legacyEndCandidate =
    task?.endTime &&
    parseTimeToMinutes(task.endTime) !== null
      ? task.endTime
      : getDefaultEndTime(legacyStartTime) || DEFAULT_END_TIME;

  const legacyStartMinutes =
    parseTimeToMinutes(legacyStartTime) ?? 0;

  const legacyEndMinutes =
    parseTimeToMinutes(legacyEndCandidate) ?? 0;

  const preferredStartTime =
    task?.preferredStartTime &&
    parseTimeToMinutes(task.preferredStartTime) !== null
      ? task.preferredStartTime
      : '16:00';

  const preferredEndCandidate =
    task?.preferredEndTime &&
    parseTimeToMinutes(task.preferredEndTime) !== null
      ? task.preferredEndTime
      : addMinutesToTime(preferredStartTime, 120) ?? '18:00';

  const preferredStartMinutes =
    parseTimeToMinutes(preferredStartTime) ?? 0;

  const preferredEndMinutes =
    parseTimeToMinutes(preferredEndCandidate) ?? 0;

  return {
    title: task?.title ?? '',
    subject: task?.subject ?? '',
    taskType: task?.taskType ?? 'assignment',

    deadlineDate:
      task?.deadlineDate ??
      formatDateInput(storedTaskDate ?? date),

    deadlineTime:
      task?.deadlineTime &&
      parseTimeToMinutes(task.deadlineTime) !== null
        ? task.deadlineTime
        : '23:45',

    estimatedMinutes:
      typeof task?.estimatedMinutes === 'number' &&
      task.estimatedMinutes > 0
        ? task.estimatedMinutes
        : 120,

    priority: task?.priority ?? 'medium',

    preferredStartTime,

    preferredEndTime:
      preferredEndMinutes > preferredStartMinutes
        ? preferredEndCandidate
        : addMinutesToTime(preferredStartTime, 120) ?? '18:00',

    // Temporary support for the current schedule code
    date: formatDateInput(storedTaskDate ?? date),

    startTime: legacyStartTime,

    endTime:
      legacyEndMinutes > legacyStartMinutes
        ? legacyEndCandidate
        : getDefaultEndTime(legacyStartTime) ??
          DEFAULT_END_TIME,
  };
}

function parseTimeToMinutes(value: string) {
  const normalized = value.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!normalized) {
    return null;
  }

  const hours = Number(normalized[1]);
  const minutes = Number(normalized[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function normalizeTimeInput(value: string) {
  const minutes = parseTimeToMinutes(value);

  if (minutes === null) {
    return '';
  }

  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
}

function formatTimeLabel(value: string) {
  const minutes = parseTimeToMinutes(value);

  if (minutes === null) {
    return value;
  }

  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(date);
}

function getTaskTimeRange(task: StudyTask) {
  if (task.startTime && task.endTime) {
    return `${formatTimeLabel(task.startTime)} – ${formatTimeLabel(task.endTime)}`;
  }

  return '';
}

function isTaskScheduled(task: StudyTask) {
  const taskDate = getStoredTaskDate(task);
  const startMinutes = task.startTime ? parseTimeToMinutes(task.startTime) : null;
  const endMinutes = task.endTime ? parseTimeToMinutes(task.endTime) : null;

  return Boolean(
    taskDate &&
      startMinutes !== null &&
      endMinutes !== null &&
      endMinutes > startMinutes,
  );
}

export default function StudyPlannerScreen() {
  const theme = useAuthTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const userId = user?.uid;
  const isWideScreen = width >= 900;
  const isDarkMode = theme.background === '#182933';
  const taskPalettes = isDarkMode ? DARK_TASK_PALETTES : LIGHT_TASK_PALETTES;
  const labelColumnWidth = isWideScreen ? 88 : 78;
  const hourSlotHeight = isWideScreen ? 70 : 62;
  const timelineHeight = HOUR_SLOT_COUNT * hourSlotHeight;

  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [screenError, setScreenError] = useState('');
  const [formError, setFormError] = useState('');

  const [showTaskFormModal, setShowTaskFormModal] =
  useState(false);

  const [activeTaskDropdown, setActiveTaskDropdown] =
  useState<TaskDropdown>(null);
  const [showTaskActionsModal, setShowTaskActionsModal] = useState(false);

  const [activePicker, setActivePicker] = useState<PickerMode>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>('task-form');
  const [calendarMonth, setCalendarMonth] = useState(() => startOfDay(new Date()));
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [selectedTask, setSelectedTask] = useState<StudyTask | null>(null);
  const [showUnscheduledTasks, setShowUnscheduledTasks] = useState(true);
  const [showAIPlannerModal, setShowAIPlannerModal] = useState(false);
  const [showAIPlanPreviewModal, setShowAIPlanPreviewModal] = useState(false);
  const [isGeneratingAIPlan, setIsGeneratingAIPlan] = useState(false);
  const [isSavingAIPlan, setIsSavingAIPlan] = useState(false);
  const [aiPlanError, setAIPlanError] = useState('');
  const [planningMode, setPlanningMode] = useState<PlanningMode>('single-day');
  const [aiPlanForm, setAIPlanForm] = useState<AIStudyFormState>(() => getAiDefaultForm(startOfDay(new Date())));
  const [aiPlanSessions, setAIPlanSessions] = useState<PlannedSession[]>([]);
  const [taskForm, setTaskForm] =
  useState<TaskFormState>(() =>
    getTaskFormDefaults(startOfDay(new Date())),
  );

  const weekDays = useMemo(() => {
    const today = startOfDay(new Date());
    const startOfWeek = addDays(today, -today.getDay());

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(startOfWeek, index);

      return {
        date,
        label: WEEKDAY_LABELS[index],
        number: formatWeekdayDate(date),
        isToday: sameDay(date, today),
      };
    });
  }, []);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    setScreenError('');

    const tasksReference = collection(db, 'users', userId, 'tasks');

    const unsubscribe = onSnapshot(
      tasksReference,
      (snapshot) => {
        const loadedTasks: StudyTask[] = snapshot.docs.map((taskDocument) => {
          const data = taskDocument.data();

          return {
            id: taskDocument.id,
            title: typeof data.title === 'string' ? data.title : 'Untitled task',
            completed: Boolean(data.completed),
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
            date:
              typeof data.date === 'string' || typeof data.date === 'number'
                ? data.date
                : null,
            dueDate:
              typeof data.dueDate === 'string' || typeof data.dueDate === 'number'
                ? data.dueDate
                : null,
            startTime:
              typeof data.startTime === 'string'
                ? data.startTime
                : null,

            endTime:
              typeof data.endTime === 'string'
                ? data.endTime
                : null,

            kind:
              data.kind === 'task' || data.kind === 'session'
                ? data.kind
                : null,

            subject:
              typeof data.subject === 'string'
                ? data.subject
                : null,

            taskType:
              typeof data.taskType === 'string'
                ? (data.taskType as TaskType)
                : null,

            deadlineDate:
              typeof data.deadlineDate === 'string'
                ? data.deadlineDate
                : null,

            deadlineTime:
              typeof data.deadlineTime === 'string'
                ? data.deadlineTime
                : null,

            estimatedMinutes:
              typeof data.estimatedMinutes === 'number'
                ? data.estimatedMinutes
                : null,

            priority:
              data.priority === 'high' ||
              data.priority === 'medium' ||
              data.priority === 'low'
                ? data.priority
                : null,

            preferredStartTime:
              typeof data.preferredStartTime === 'string'
                ? data.preferredStartTime
                : null,

            preferredEndTime:
              typeof data.preferredEndTime === 'string'
                ? data.preferredEndTime
                : null,

            source:
              data.source === 'manual' || data.source === 'ai'
                ? data.source
                : null,
          };
        });

        loadedTasks.sort((firstTask, secondTask) => secondTask.createdAt - firstTask.createdAt);
        setTasks(loadedTasks);
        setIsLoadingTasks(false);
      },
      (error) => {
        console.error('Failed to load study tasks:', error);
        setScreenError('Could not load your tasks. Check your connection and Firestore rules.');
        setIsLoadingTasks(false);
      },
    );

    return unsubscribe;
  }, [userId]);

  const scheduledDayTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (!isTaskScheduled(task)) {
          return false;
        }

        const taskDate = getStoredTaskDate(task);
        return Boolean(taskDate && sameDay(startOfDay(taskDate), selectedDate));
      })
      .sort((firstTask, secondTask) => {
        const firstMinutes = parseTimeToMinutes(firstTask.startTime ?? '') ?? Number.MAX_SAFE_INTEGER;
        const secondMinutes = parseTimeToMinutes(secondTask.startTime ?? '') ?? Number.MAX_SAFE_INTEGER;

        if (firstMinutes !== secondMinutes) {
          return firstMinutes - secondMinutes;
        }

        return secondTask.createdAt - firstTask.createdAt;
      });
  }, [selectedDate, tasks]);

  const pendingStudyTasks = useMemo(() => {
    return tasks
      .filter(
        (task) =>
          task.kind === 'task' &&
          !task.completed,
      )
      .sort((firstTask, secondTask) => {
        const firstDeadline =
          firstTask.deadlineDate ?? '9999-12-31';

        const secondDeadline =
          secondTask.deadlineDate ?? '9999-12-31';

        if (firstDeadline !== secondDeadline) {
          return firstDeadline.localeCompare(
            secondDeadline,
          );
        }

        const priorityOrder: Record<
          TaskPriority,
          number
        > = {
          high: 0,
          medium: 1,
          low: 2,
        };

        const firstPriority =
          firstTask.priority ?? 'medium';

        const secondPriority =
          secondTask.priority ?? 'medium';

        return (
          priorityOrder[firstPriority] -
          priorityOrder[secondPriority]
        );
      });
  }, [tasks]);

  const unscheduledTasks = useMemo(() => {
    return tasks
      .filter((task) => !isTaskScheduled(task))
      .sort((firstTask, secondTask) => secondTask.createdAt - firstTask.createdAt);
  }, [tasks]);

  useEffect(() => {
    if (unscheduledTasks.length > 0) {
      setShowUnscheduledTasks(true);
    }
  }, [unscheduledTasks.length]);

  const selectedTaskTypeOption =
    TASK_TYPE_OPTIONS.find(
      (option) => option.value === taskForm.taskType,
    );

  const selectedTaskTypeLabel =
    selectedTaskTypeOption?.label ?? 'Select task type';

  const selectedTaskTypeIcon =
    selectedTaskTypeOption?.icon ??
    'document-text-outline';

  const selectedEstimatedTimeLabel =
    ESTIMATED_TIME_OPTIONS.find(
      (option) =>
        option.value === taskForm.estimatedMinutes,
    )?.label ?? 'Select estimated time';

  const selectedPriorityLabel =
    PRIORITY_OPTIONS.find(
      (option) => option.value === taskForm.priority,
    )?.label ?? 'Select priority';

  const selectedDayLabel = useMemo(() => formatLongDay(selectedDate), [selectedDate]);

  const dateFieldLabel = useMemo(() => {
    const parsedDate =
      parseDateInput(taskForm.deadlineDate);

    return parsedDate
      ? formatReadableDate(parsedDate)
      : 'Select deadline date';
  }, [taskForm.deadlineDate]);

  const startTimeOptions = useMemo(
    () => TIME_OPTIONS,
    [],
  );

  const isAIFormPicker =
    pickerTarget !== 'task-form';

  const pickerStartTime = isAIFormPicker
    ? aiPlanForm.startTime
    : taskForm.startTime;

  const pickerEndTime = isAIFormPicker
    ? aiPlanForm.endTime
    : taskForm.endTime;

  const endTimeOptions = useMemo(
    () => getTimeOptionsAfter(pickerStartTime),
    [pickerStartTime],
  );

  const activeTimeOptions =
    activePicker === 'startTime'
      ? startTimeOptions
      : endTimeOptions;

  const activeTimeFieldValue =
    activePicker === 'startTime'
      ? pickerStartTime
      : pickerEndTime;

  const activePickerTitle =
    activePicker === 'date' ? 'Select Date' : activePicker === 'startTime' ? 'Select Start Time' : 'Select End Time';

  const activeTimePickerList = activePicker === 'startTime' || activePicker === 'endTime';

  const openAddTaskModal = () => {
    if (!userId) {
      return;
    }

    setEditingTaskId(null);
    setFormError('');
    setActiveTaskDropdown(null);
    setTaskForm(getTaskFormDefaults(selectedDate));
    setCalendarMonth(selectedDate);
    setActivePicker(null);
    setPickerTarget('task-form');
    setShowTaskFormModal(true);
  };

  const openAIPlannerModal = () => {
    if (pendingStudyTasks.length === 0) {
      setScreenError(
        'Add at least one pending study task before generating a plan.',
      );
      return;
    }

    const subjects = Array.from(
      new Set(
        pendingStudyTasks
          .map((task) => task.subject?.trim())
          .filter(
            (subject): subject is string =>
              Boolean(subject),
          ),
      ),
    );

    const nextForm =
      getAiDefaultForm(selectedDate);

    nextForm.subjectsInput =
      subjects.join(', ');

    setScreenError('');
    setAIPlanError('');
    setAIPlanSessions([]);
    setAIPlanForm(nextForm);
    setPlanningMode('single-day');
    setCalendarMonth(selectedDate);
    setActivePicker(null);
    setPickerTarget('ai-study-date');
    setShowAIPlannerModal(true);
  };

  const closeTaskFormModal = () => {
    if (isSavingTask) {
      return;
    }

    setShowTaskFormModal(false);
    setActivePicker(null);
    setActiveTaskDropdown(null);
    setPickerTarget('task-form');
    setFormError('');
    setEditingTaskId(null);
    setTaskForm(getTaskFormDefaults(selectedDate));
  };

  const closeAllPickers = () => {
    setActivePicker(null);
    setPickerTarget('task-form');
  };

  const openPicker = (mode: Exclude<PickerMode, null>, target: PickerTarget = 'task-form') => {
    setFormError('');
    setAIPlanError('');
    setPickerTarget(target);

    if (mode === 'date') {
      const parsedDate = target === 'task-form'
        ? parseDateInput(taskForm.deadlineDate) ?? selectedDate
        : target === 'ai-start-date'
          ? parseDateInput(aiPlanForm.startDate) ?? selectedDate
          : target === 'ai-end-date'
            ? parseDateInput(aiPlanForm.endDate) ?? selectedDate
            : parseDateInput(aiPlanForm.studyDate) ?? selectedDate;
      setCalendarMonth(parsedDate);
    }

    setActivePicker(mode);
  };

  const selectDateFromCalendar = (date: Date) => {
    if (pickerTarget === 'ai-study-date') {
      setAIPlanForm((currentValue) => ({
        ...currentValue,
        studyDate: formatDateInput(date),
        startDate: formatDateInput(date),
        endDate: formatDateInput(date),
      }));
    } else if (pickerTarget === 'ai-start-date') {
      setAIPlanForm((currentValue) => ({
        ...currentValue,
        startDate: formatDateInput(date),
      }));
    } else if (pickerTarget === 'ai-end-date') {
      setAIPlanForm((currentValue) => ({
        ...currentValue,
        endDate: formatDateInput(date),
      }));
    } else {
      setTaskForm((currentValue) => ({
        ...currentValue,
        deadlineDate: formatDateInput(date),
        date: formatDateInput(date),
      }));
    }

    setCalendarMonth(date);
    setActivePicker(null);
  };

  const selectStartTime = (nextStartTime: string) => {
    if (pickerTarget === 'ai-start-date' || pickerTarget === 'ai-end-date' || pickerTarget === 'ai-study-date' || pickerTarget === 'ai-edit-date' || pickerTarget === 'ai-edit-start' || pickerTarget === 'ai-edit-end') {
      setAIPlanForm((currentValue) => ({
        ...currentValue,
        startTime: nextStartTime,
        endTime: getDefaultEndTime(nextStartTime) || currentValue.endTime,
      }));
    } else {
      setTaskForm((currentValue) => {
        const currentEndMinutes = parseTimeToMinutes(currentValue.endTime);
        const nextStartMinutes = parseTimeToMinutes(nextStartTime);
        const nextDefaultEndTime = getDefaultEndTime(nextStartTime);

        const shouldAdjustEndTime =
          currentEndMinutes === null ||
          nextStartMinutes === null ||
          currentEndMinutes <= nextStartMinutes;

        return {
          ...currentValue,
          startTime: nextStartTime,
          endTime: shouldAdjustEndTime ? nextDefaultEndTime : currentValue.endTime,
        };
      });
    }
    setActivePicker(null);
  };

  const selectEndTime = (nextEndTime: string) => {
    if (pickerTarget === 'ai-start-date' || pickerTarget === 'ai-end-date' || pickerTarget === 'ai-study-date' || pickerTarget === 'ai-edit-date' || pickerTarget === 'ai-edit-start' || pickerTarget === 'ai-edit-end') {
      setAIPlanForm((currentValue) => ({
        ...currentValue,
        endTime: nextEndTime,
      }));
    } else {
      setTaskForm((currentValue) => ({
        ...currentValue,
        endTime: nextEndTime,
      }));
    }
    setActivePicker(null);
  };

  const openTaskActionsModal = (task: StudyTask) => {
    setSelectedTask(task);
    setShowTaskActionsModal(true);
  };

  const closeTaskActionsModal = () => {
    setShowTaskActionsModal(false);
    setSelectedTask(null);
  };

  const openEditTaskModal = (task: StudyTask) => {
    const taskDate =
      parseDateInput(task.deadlineDate ?? '') ??
      getStoredTaskDate(task) ??
      selectedDate;

    setEditingTaskId(task.id);
    setFormError('');
    setActiveTaskDropdown(null);
    setTaskForm(getTaskFormDefaults(taskDate, task));
    setCalendarMonth(taskDate);
    setActivePicker(null);
    setPickerTarget('task-form');
    setShowTaskFormModal(true);
  };

  const toggleAiStudyDay = (dayValue: number) => {
    setAIPlanForm((currentValue) => {
      const isSelected = currentValue.studyDays.includes(dayValue);

      return {
        ...currentValue,
        studyDays: isSelected
          ? currentValue.studyDays.filter((value) => value !== dayValue)
          : [...currentValue.studyDays, dayValue].sort((first, second) => first - second),
      };
    });
  };

  const updateAiPlanSession = (sessionId: string, included: boolean) => {
    setAIPlanSessions((currentValue) =>
      currentValue.map((session) =>
        session.id === sessionId ? { ...session, included } : session,
      ),
    );
  };

  const closeAIPlannerModal = () => {
    if (isGeneratingAIPlan || isSavingAIPlan) {
      return;
    }

    setShowAIPlannerModal(false);
    setShowAIPlanPreviewModal(false);
    setAIPlanError('');
    setAIPlanSessions([]);
    setActivePicker(null);
    setPickerTarget('task-form');
  };

  const closeAIPlanPreview = () => {
    if (isSavingAIPlan) {
      return;
    }

    setShowAIPlanPreviewModal(false);
    setAIPlanError('');
  };

  const generateAIStudyPlan = async () => {
    if (!userId || isGeneratingAIPlan) {
      return;
    }

    const subjects = normalizeSubjectsFromInput(aiPlanForm.subjectsInput);
    const modeLabel = planningMode === 'single-day' ? 'single-day' : 'weekly';
    const requestStartedAt = Date.now();

    if (subjects.length === 0) {
      setAIPlanError('Add at least one subject or topic.');
      return;
    }

    const startDate = planningMode === 'single-day' ? parseDateInput(aiPlanForm.studyDate) : parseDateInput(aiPlanForm.startDate);
    const endDate = planningMode === 'single-day' ? parseDateInput(aiPlanForm.studyDate) : parseDateInput(aiPlanForm.endDate);
    const normalizedStartTime = normalizeTimeInput(aiPlanForm.startTime);
    const normalizedEndTime = normalizeTimeInput(aiPlanForm.endTime);

    if (!startDate || !endDate) {
      setAIPlanError('Choose a valid date range.');
      return;
    }

    if (!normalizedStartTime || !normalizedEndTime) {
      setAIPlanError('Choose a valid study window.');
      return;
    }

    if (endDate < startDate) {
      setAIPlanError('The end date must come after the start date.');
      return;
    }

    if (__DEV__) {
      console.log('AI planner request started', { mode: modeLabel });
    }

    try {
      setIsGeneratingAIPlan(true);
      setAIPlanError('');

      const response = await AI_MODEL.generateContent({
        contents: [{ role: 'user', parts: [{ text: buildPlanningPrompt(
              planningMode,
              aiPlanForm,
              pendingStudyTasks,
            ) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      });

      const rawText = response.response.text();

      if (__DEV__) {
        console.log('AI planner response received', {
          mode: modeLabel,
          rawResponseText: rawText,
          elapsedMs: Date.now() - requestStartedAt,
        });
      }

      const parsedPlan = parseAiResponsePayload(rawText);

      if (!parsedPlan) {
        if (__DEV__) {
          console.warn('AI planner JSON parse failed', { mode: modeLabel });
        }

        setAIPlanError('The AI returned an invalid schedule.');
        return;
      }

      const validationResult = validateGeneratedSessions(planningMode, aiPlanForm, parsedPlan.sessions);

      if (__DEV__) {
        console.log('AI planner validation summary', {
          mode: modeLabel,
          generatedSessions: parsedPlan.sessions.length,
          rejectedSessions: validationResult.rejectedCount,
          validSessions: validationResult.sessions.length,
        });
      }

      if (validationResult.sessions.length === 0) {
        setAIPlanError(validationResult.rejectionReason || 'No valid sessions matched your selected days and times.');
        return;
      }

      const previewSessions = validationResult.sessions
        .map((session, index) => ({
          id: getPlannedSessionId(session, index),
          title: session.title,
          subject: session.subject,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          included: true,
        }))
        .sort((firstSession, secondSession) => {
          if (firstSession.date !== secondSession.date) {
            return firstSession.date.localeCompare(secondSession.date);
          }

          return firstSession.startTime.localeCompare(secondSession.startTime);
        });

      setAIPlanSessions(previewSessions);
      setShowAIPlannerModal(false);
      setShowAIPlanPreviewModal(true);
    } catch (error) {
      const friendlyMessage = getAiServiceErrorMessage(error);

      if (__DEV__) {
        console.error('Failed to generate AI study plan', {
          mode: modeLabel,
          message: error instanceof Error ? error.message : String(error),
          error,
        });
      }

      setAIPlanError(friendlyMessage);
    } finally {
      setIsGeneratingAIPlan(false);
    }
  };

  const saveAIStudyPlan = async () => {
    if (!userId || isSavingAIPlan) {
      return;
    }

    const includedSessions = aiPlanSessions.filter((session) => session.included);

    if (includedSessions.length === 0) {
      setAIPlanError('Include at least one session before saving.');
      return;
    }

    try {
      setIsSavingAIPlan(true);
      setAIPlanError('');

      const batch = writeBatch(db);

      includedSessions.forEach((session) => {
        const taskDate = parseDateInput(session.date);

        if (!taskDate) {
          return;
        }

        const taskReference = doc(collection(db, 'users', userId, 'tasks'));

        batch.set(taskReference, {
          title: session.title,
          subject: session.subject,
          completed: false,
          createdAt: Date.now(),
          date: formatDateInput(taskDate),
          dueDate: formatDateInput(taskDate),
          startTime: normalizeTimeInput(session.startTime) || session.startTime,
          endTime: normalizeTimeInput(session.endTime) || session.endTime,
          source: 'ai',
          kind: 'session',
          planningMode,
        });
      });

      await batch.commit();

      setShowAIPlanPreviewModal(false);
      setAIPlanSessions([]);
      setAIPlanForm(getAiDefaultForm(selectedDate));
    } catch (error) {
      console.error('Failed to save AI study plan:', error);
      setAIPlanError('The AI study plan could not be saved.');
    } finally {
      setIsSavingAIPlan(false);
    }
  };

  const validateTaskForm = () => {
    const trimmedTitle = taskForm.title.trim();
    const trimmedSubject = taskForm.subject.trim();

    const normalizedDeadlineDate =
      parseDateInput(taskForm.deadlineDate);

    const normalizedDeadlineTime =
      normalizeTimeInput(taskForm.deadlineTime);

    const normalizedPreferredStart =
      normalizeTimeInput(taskForm.preferredStartTime);

    const normalizedPreferredEnd =
      normalizeTimeInput(taskForm.preferredEndTime);

    if (!trimmedTitle) {
      return 'Task title cannot be empty.';
    }

    if (!trimmedSubject) {
      return 'Subject cannot be empty.';
    }

    if (!normalizedDeadlineDate) {
      return 'Choose a valid deadline date.';
    }

    if (!normalizedDeadlineTime) {
      return 'Choose a valid deadline time.';
    }

    if (
      !Number.isFinite(taskForm.estimatedMinutes) ||
      taskForm.estimatedMinutes <= 0
    ) {
      return 'Choose the estimated study time.';
    }

    if (
      !normalizedPreferredStart ||
      !normalizedPreferredEnd
    ) {
      return 'Choose a valid preferred study window.';
    }

    const preferredStartMinutes =
      parseTimeToMinutes(normalizedPreferredStart);

    const preferredEndMinutes =
      parseTimeToMinutes(normalizedPreferredEnd);

    if (
      preferredStartMinutes === null ||
      preferredEndMinutes === null ||
      preferredEndMinutes <= preferredStartMinutes
    ) {
      return 'Preferred end time must be later than start time.';
    }

    return null;
  };

  const addTask = async () => {
    if (!userId || isSavingTask) {
      return;
    }

    const validationError = validateTaskForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const deadlineDate =
      parseDateInput(taskForm.deadlineDate);

    const deadlineTime =
      normalizeTimeInput(taskForm.deadlineTime);

    const preferredStartTime =
      normalizeTimeInput(taskForm.preferredStartTime);

    const preferredEndTime =
      normalizeTimeInput(taskForm.preferredEndTime);

    if (
      !deadlineDate ||
      !deadlineTime ||
      !preferredStartTime ||
      !preferredEndTime
    ) {
      setFormError(
        'Please check the deadline and preferred study time.',
      );
      return;
    }

    try {
      setIsSavingTask(true);
      setFormError('');

      await addDoc(
        collection(db, 'users', userId, 'tasks'),
        {
          kind: 'task',
          title: taskForm.title.trim(),
          subject: taskForm.subject.trim(),
          taskType: taskForm.taskType,
          deadlineDate: formatDateInput(deadlineDate),
          deadlineTime,
          dueDate: formatDateInput(deadlineDate),
          estimatedMinutes: taskForm.estimatedMinutes,
          priority: taskForm.priority,
          preferredStartTime,
          preferredEndTime,
          completed: false,
          createdAt: Date.now(),
          source: 'manual',

          // A pending task is not a scheduled session.
          date: null,
          startTime: null,
          endTime: null,
        },
      );

      closeTaskFormModal();
    } catch (error) {
      console.error('Failed to add study task:', error);
      setFormError('The study task could not be added.');
    } finally {
      setIsSavingTask(false);
    }
  };

  const saveEditedTask = async () => {
    if (!userId || !editingTaskId || isSavingTask) {
      return;
    }

    const validationError = validateTaskForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const deadlineDate =
      parseDateInput(taskForm.deadlineDate);

    const deadlineTime =
      normalizeTimeInput(taskForm.deadlineTime);

    const preferredStartTime =
      normalizeTimeInput(taskForm.preferredStartTime);

    const preferredEndTime =
      normalizeTimeInput(taskForm.preferredEndTime);

    if (
      !deadlineDate ||
      !deadlineTime ||
      !preferredStartTime ||
      !preferredEndTime
    ) {
      setFormError(
        'Please check the deadline and preferred study time.',
      );
      return;
    }

    try {
      setIsSavingTask(true);
      setFormError('');

      const taskReference = doc(
        db,
        'users',
        userId,
        'tasks',
        editingTaskId,
      );

      await updateDoc(taskReference, {
        kind: 'task',
        title: taskForm.title.trim(),
        subject: taskForm.subject.trim(),
        taskType: taskForm.taskType,
        deadlineDate: formatDateInput(deadlineDate),
        deadlineTime,
        dueDate: formatDateInput(deadlineDate),
        estimatedMinutes: taskForm.estimatedMinutes,
        priority: taskForm.priority,
        preferredStartTime,
        preferredEndTime,
        source: 'manual',

        // Keep it in Pending Tasks until a schedule is generated.
        date: null,
        startTime: null,
        endTime: null,
      });

      closeTaskFormModal();
    } catch (error) {
      console.error('Failed to edit study task:', error);
      setFormError(
        'The edited study task could not be saved.',
      );
    } finally {
      setIsSavingTask(false);
    }
  };

  const toggleTask = async (task: StudyTask) => {
    if (!userId) {
      return;
    }

    try {
      setScreenError('');

      const taskReference = doc(db, 'users', userId, 'tasks', task.id);

      await updateDoc(taskReference, {
        completed: !task.completed,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      setScreenError('The task could not be updated.');
    }
  };

  const confirmDeleteTask = (task: StudyTask) => {
    Alert.alert(
      'Delete task?',
      'This task will be removed from your planner.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteTask(task.id);
          },
        },
      ],
    );
  };

  const deleteTask = async (taskId: string) => {
    if (!userId) {
      return;
    }

    try {
      setScreenError('');

      const taskReference = doc(db, 'users', userId, 'tasks', taskId);

      await deleteDoc(taskReference);

      if (editingTaskId === taskId) {
        closeTaskFormModal();
      }

      if (selectedTask?.id === taskId) {
        closeTaskActionsModal();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      setScreenError('The task could not be deleted.');
    }
  };

  const handleTaskAction = async (action: TaskAction) => {
    if (!selectedTask) {
      return;
    }

    if (action === 'toggleComplete') {
      await toggleTask(selectedTask);
      closeTaskActionsModal();
      return;
    }

    if (action === 'edit') {
      closeTaskActionsModal();
      openEditTaskModal(selectedTask);
      return;
    }

    if (action === 'delete') {
      closeTaskActionsModal();
      confirmDeleteTask(selectedTask);
    }
  };

  const taskTimelineHeight = useMemo(() => timelineHeight, [timelineHeight]);

  const timelineTaskPalette = (index: number) => taskPalettes[index % taskPalettes.length];

  const calendarWeeks = useMemo(() => getDaysInMonthGrid(calendarMonth), [calendarMonth]);

  const selectedCalendarDate = useMemo(() => {
    if (pickerTarget === 'ai-study-date') {
      return (
        parseDateInput(aiPlanForm.studyDate) ??
        selectedDate
      );
    }

    if (pickerTarget === 'ai-start-date') {
      return (
        parseDateInput(aiPlanForm.startDate) ??
        selectedDate
      );
    }

    if (pickerTarget === 'ai-end-date') {
      return (
        parseDateInput(aiPlanForm.endDate) ??
        selectedDate
      );
    }

    return (
      parseDateInput(taskForm.deadlineDate) ??
      selectedDate
    );
  }, [
    aiPlanForm.endDate,
    aiPlanForm.startDate,
    aiPlanForm.studyDate,
    pickerTarget,
    selectedDate,
    taskForm.deadlineDate,
  ]);

  return (
    <ScreenContainer scrollable contentWidthStyle={styles.pageWidth}>
      <View style={styles.page}>
        <View style={[styles.headerRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.headerIcon, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <Ionicons name="calendar-outline" size={22} color={theme.primary} />
          </View>

          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: theme.text }]}>Study Planner</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Add your deadlines, then generate a smart study schedule.</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={openAIPlannerModal}
              disabled={!userId || isGeneratingAIPlan || isSavingAIPlan}
              style={({ pressed }) => [
                styles.aiPlanButton,
                {
                  backgroundColor: '#203647',
                  opacity: !userId || isGeneratingAIPlan || isSavingAIPlan ? 0.55 : pressed ? 0.9 : 1,
                },
              ]}
            >
              <Ionicons name="sparkles" size={16} color="#F4F8FB" />
              <Text style={styles.aiPlanButtonText}>Generate Plan</Text>
            </Pressable>

            <Pressable
              onPress={openAddTaskModal}
              disabled={!userId || isSavingTask}
              style={({ pressed }) => [
                styles.addPlanButton,
                {
                  backgroundColor: theme.primary,
                  opacity: !userId || isSavingTask ? 0.55 : pressed ? 0.9 : 1,
                },
              ]}
            >
              <Ionicons name="add" size={18} color={theme.buttonText} />
              <Text style={[styles.addPlanButtonText, { color: theme.buttonText }]}>Add Study</Text>
            </Pressable>
          </View>
        </View>

        {!userId ? (
          <View style={[styles.helperBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={16} color={theme.primary} />
            <Text style={[styles.helperBarText, { color: theme.textMuted }]}>Sign in to keep your study plans synced to Firestore.</Text>
          </View>
        ) : null}

        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>This week</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Choose a day to focus the timeline below.</Text>
            </View>

            <Pressable
              onPress={() => setSelectedDate(startOfDay(new Date()))}
              style={({ pressed }) => [
                styles.todayButton,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.todayButtonText, { color: theme.text }]}>Today</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.weekScrollerContent}
            style={styles.weekScroller}
          >
            {weekDays.map((weekDay) => {
              const isSelected = sameDay(weekDay.date, selectedDate);

              return (
                <Pressable
                  key={weekDay.label + weekDay.date.toISOString()}
                  onPress={() => setSelectedDate(weekDay.date)}
                  style={({ pressed }) => [
                    styles.weekDayButton,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.inputBackground,
                      borderColor: isSelected ? theme.primary : theme.border,
                      opacity: pressed ? 0.94 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.weekDayLabel, { color: isSelected ? theme.buttonText : theme.textMuted }]}>
                    {weekDay.label}
                  </Text>
                  <Text style={[styles.weekDayNumber, { color: isSelected ? theme.buttonText : theme.text }]}>
                    {weekDay.number}
                  </Text>

                  {weekDay.isToday ? (
                    <View style={[styles.todayDot, { backgroundColor: isSelected ? theme.buttonText : theme.primary }]} />
                  ) : (
                    <View style={styles.todayDotSpacer} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {screenError ? <Text style={[styles.screenError, { color: theme.error }]}>{screenError}</Text> : null}

        <View style={[styles.timelineCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{selectedDayLabel}</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Study Schedule</Text>
            </View>

            <View style={[styles.timelineBadge, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              <Ionicons name="time-outline" size={14} color={theme.primary} />
              <Text style={[styles.timelineBadgeText, { color: theme.textMuted }]}>{scheduledDayTasks.length} planned</Text>
            </View>
          </View>

          {isLoadingTasks ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading your tasks...</Text>
            </View>
          ) : !userId ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={24} color={theme.primary} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Sign in to see your schedule</Text>
              <Text style={[styles.emptyStateCopy, { color: theme.textMuted }]}>Your weekly timetable is synced to your account through Firestore.</Text>
            </View>
          ) : scheduledDayTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="sparkles-outline" size={24} color={theme.primary} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Your schedule is clear</Text>
              <Text style={[styles.emptyStateCopy, { color: theme.textMuted }]}>Tap Add Plan to place a task into today’s timetable.</Text>
            </View>
          ) : (
            <View style={[styles.timelineCanvas, { minHeight: taskTimelineHeight }]}>
              {Array.from({ length: HOUR_SLOT_COUNT }, (_, index) => {
                const hour = TIMELINE_START_HOUR + index;

                return (
                  <View key={hour} style={[styles.timelineRow, { top: index * hourSlotHeight, height: hourSlotHeight }]}>
                    <Text style={[styles.hourLabel, { width: labelColumnWidth, color: theme.textMuted }]}>
                      {formatTimeLabel(`${String(hour).padStart(2, '0')}:00`)}
                    </Text>

                    <View style={[styles.hourDivider, { borderTopColor: theme.border }]} />
                  </View>
                );
              })}

              {scheduledDayTasks.map((task, index) => {
                const startMinutes = parseTimeToMinutes(task.startTime ?? '') ?? TIMELINE_START_HOUR * 60;
                const endMinutes = parseTimeToMinutes(task.endTime ?? '') ?? startMinutes + 45;
                const clampedStart = Math.max(startMinutes, TIMELINE_START_HOUR * 60);
                const clampedEnd = Math.min(endMinutes, TIMELINE_END_HOUR * 60);
                const taskTop = ((clampedStart - TIMELINE_START_HOUR * 60) / 60) * hourSlotHeight + 6;
                const taskHeight = Math.max(((clampedEnd - clampedStart) / 60) * hourSlotHeight - 8, 54);
                const palette = timelineTaskPalette(index);

                return (
                  <Pressable
                    key={task.id}
                    onPress={() => openTaskActionsModal(task)}
                    style={({ pressed }) => [
                      styles.timelineTaskCard,
                      {
                        top: taskTop,
                        height: taskHeight,
                        backgroundColor: task.completed ? theme.inputBackground : palette.background,
                        borderColor: palette.border,
                        shadowColor: palette.accent,
                        left: labelColumnWidth + 12,
                        right: 8,
                        opacity: task.completed ? 0.78 : pressed ? 0.94 : 1,
                      },
                    ]}
                  >
                    <View style={styles.timelineTaskHeader}>
                      <View style={[styles.timelineAccent, { backgroundColor: palette.accent }]} />
                      <View style={styles.timelineTaskCopy}>
                        <Text
                          style={[
                            styles.timelineTaskTitle,
                            {
                              color: task.completed ? theme.textMuted : theme.text,
                              textDecorationLine: task.completed ? 'line-through' : 'none',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>

                        <Text style={[styles.timelineTaskTime, { color: theme.textMuted }]} numberOfLines={1}>
                          {task.subject ? `${task.subject} | ${getTaskTimeRange(task)}` : getTaskTimeRange(task)}
                        </Text>
                      </View>

                      <View style={[styles.taskStatusDot, { backgroundColor: task.completed ? '#4ADE80' : palette.accent }]}>
                        <Ionicons name={task.completed ? 'checkmark' : 'ellipse'} size={10} color={task.completed ? '#FFFFFF' : palette.accent} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {unscheduledTasks.length > 0 ? (
          <View style={[styles.unscheduledCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable
              onPress={() => setShowUnscheduledTasks((currentValue) => !currentValue)}
              style={styles.unscheduledHeader}
            >
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Pending Tasks</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{unscheduledTasks.length} task{unscheduledTasks.length === 1 ? '' : 's'}</Text>
              </View>

              <Ionicons
                name={showUnscheduledTasks ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.textMuted}
              />
            </Pressable>

            {showUnscheduledTasks ? (
              <View style={styles.unscheduledList}>
                {unscheduledTasks.map((task, index) => {
                  const palette = timelineTaskPalette(index);

                  return (
                    <Pressable
                      key={task.id}
                      onPress={() => openTaskActionsModal(task)}
                      style={({ pressed }) => [
                        styles.unscheduledItem,
                        {
                          backgroundColor: task.completed ? theme.inputBackground : palette.background,
                          borderColor: palette.border,
                          opacity: task.completed ? 0.82 : pressed ? 0.94 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.unscheduledAccent, { backgroundColor: palette.accent }]} />
                      <View style={styles.unscheduledCopy}>
                        <Text
                          style={[
                            styles.unscheduledTitle,
                            {
                              color: task.completed ? theme.textMuted : theme.text,
                              textDecorationLine: task.completed ? 'line-through' : 'none',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>

                        <Text style={[styles.unscheduledMeta, { color: theme.textMuted }]}>Tap for actions</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <Modal visible={showAIPlannerModal} transparent animationType="fade" onRequestClose={closeAIPlannerModal}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAIPlannerModal} />

          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>✨ Generate Plan</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Generate a schedule from your pending tasks and deadlines.</Text>
              </View>

              <Pressable onPress={closeAIPlannerModal} style={styles.modalCloseButton}>
                <Ionicons name="close-outline" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={styles.segmentedControl}>
              <Pressable
                onPress={() => setPlanningMode('single-day')}
                disabled={isGeneratingAIPlan || isSavingAIPlan}
                style={({ pressed }) => [
                  styles.segmentButton,
                  {
                    backgroundColor: planningMode === 'single-day' ? theme.primary : theme.inputBackground,
                    borderColor: planningMode === 'single-day' ? theme.primary : theme.border,
                    opacity: pressed ? 0.94 : 1,
                  },
                ]}
              >
                <Text style={[styles.segmentButtonText, { color: planningMode === 'single-day' ? theme.buttonText : theme.text }]}>Single day</Text>
              </Pressable>

              <Pressable
                onPress={() => setPlanningMode('weekly')}
                disabled={isGeneratingAIPlan || isSavingAIPlan}
                style={({ pressed }) => [
                  styles.segmentButton,
                  {
                    backgroundColor: planningMode === 'weekly' ? theme.primary : theme.inputBackground,
                    borderColor: planningMode === 'weekly' ? theme.primary : theme.border,
                    opacity: pressed ? 0.94 : 1,
                  },
                ]}
              >
                <Text style={[styles.segmentButtonText, { color: planningMode === 'weekly' ? theme.buttonText : theme.text }]}>Weekly plan</Text>
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Pending task subjects</Text>
              <TextInput
                value={aiPlanForm.subjectsInput}
                onChangeText={(value) => setAIPlanForm((currentValue) => ({ ...currentValue, subjectsInput: value }))}
                editable={!isGeneratingAIPlan && !isSavingAIPlan}
                placeholder="Math, Biology, Quran revision"
                placeholderTextColor={theme.textMuted}
                multiline
                style={[
                  styles.modalInput,
                  styles.multiLineInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />
            </View>

            {planningMode === 'single-day' ? (
              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>STUDY DATE</Text>
                <Pressable
                  onPress={() => openPicker('date', 'ai-study-date')}
                  disabled={isGeneratingAIPlan || isSavingAIPlan}
                  style={({ pressed }) => [
                    styles.selectorButton,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: activePicker === 'date' && pickerTarget === 'ai-study-date' ? theme.primary : theme.border,
                      opacity: isGeneratingAIPlan || isSavingAIPlan ? 0.65 : pressed ? 0.94 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.selectorButtonText, { color: theme.text }]}>{formatAiFriendlyDate(parseDateInput(aiPlanForm.studyDate) ?? selectedDate)}</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Study days</Text>
                  <View style={styles.dayChipRow}>
                    {AI_DAY_OPTIONS.map((dayOption) => {
                      const isSelected = aiPlanForm.studyDays.includes(dayOption.value);

                      return (
                        <Pressable
                          key={dayOption.value}
                          onPress={() => toggleAiStudyDay(dayOption.value)}
                          disabled={isGeneratingAIPlan || isSavingAIPlan}
                          style={({ pressed }) => [
                            styles.dayChip,
                            {
                              backgroundColor: isSelected ? theme.primary : theme.inputBackground,
                              borderColor: isSelected ? theme.primary : theme.border,
                              opacity: pressed ? 0.94 : 1,
                            },
                          ]}
                        >
                          <Text style={[styles.dayChipText, { color: isSelected ? theme.buttonText : theme.text }]}>{dayOption.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Start date</Text>
                    <Pressable
                      onPress={() => openPicker('date', 'ai-start-date')}
                      disabled={isGeneratingAIPlan || isSavingAIPlan}
                      style={({ pressed }) => [
                        styles.selectorButton,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: activePicker === 'date' && pickerTarget === 'ai-start-date' ? theme.primary : theme.border,
                          opacity: isGeneratingAIPlan || isSavingAIPlan ? 0.65 : pressed ? 0.94 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.selectorButtonText, { color: theme.text }]}>{formatAiFriendlyDate(parseDateInput(aiPlanForm.startDate) ?? selectedDate)}</Text>
                      <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
                    </Pressable>
                  </View>

                  <View style={styles.formGroupHalf}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>End date</Text>
                    <Pressable
                      onPress={() => openPicker('date', 'ai-end-date')}
                      disabled={isGeneratingAIPlan || isSavingAIPlan}
                      style={({ pressed }) => [
                        styles.selectorButton,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: activePicker === 'date' && pickerTarget === 'ai-end-date' ? theme.primary : theme.border,
                          opacity: isGeneratingAIPlan || isSavingAIPlan ? 0.65 : pressed ? 0.94 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.selectorButtonText, { color: theme.text }]}>{formatAiFriendlyDate(parseDateInput(aiPlanForm.endDate) ?? addDays(selectedDate, 6))}</Text>
                      <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
                    </Pressable>
                  </View>
                </View>
              </>
            )}

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Start time</Text>
                <Pressable
                  onPress={() => openPicker('startTime', planningMode === 'single-day' ? 'ai-study-date' : 'ai-start-date')}
                  disabled={isGeneratingAIPlan || isSavingAIPlan}
                  style={({ pressed }) => [
                    styles.selectorButton,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: activePicker === 'startTime' && (pickerTarget === 'ai-study-date' || pickerTarget === 'ai-start-date') ? theme.primary : theme.border,
                      opacity: isGeneratingAIPlan || isSavingAIPlan ? 0.65 : pressed ? 0.94 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.selectorButtonText, { color: theme.text }]}>{formatTimeDisplay(aiPlanForm.startTime)}</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
                </Pressable>
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>End time</Text>
                <Pressable
                  onPress={() => openPicker('endTime', planningMode === 'single-day' ? 'ai-study-date' : 'ai-end-date')}
                  disabled={isGeneratingAIPlan || isSavingAIPlan}
                  style={({ pressed }) => [
                    styles.selectorButton,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: activePicker === 'endTime' && (pickerTarget === 'ai-study-date' || pickerTarget === 'ai-end-date') ? theme.primary : theme.border,
                      opacity: isGeneratingAIPlan || isSavingAIPlan ? 0.65 : pressed ? 0.94 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.selectorButtonText, { color: theme.text }]}>{formatTimeDisplay(aiPlanForm.endTime)}</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
                </Pressable>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Session length</Text>
              <View style={styles.lengthChipRow}>
                {AI_SESSION_LENGTH_OPTIONS.map((lengthValue) => {
                  const isSelected = aiPlanForm.sessionLength === lengthValue;

                  return (
                    <Pressable
                      key={lengthValue}
                      onPress={() => setAIPlanForm((currentValue) => ({ ...currentValue, sessionLength: lengthValue }))}
                      disabled={isGeneratingAIPlan || isSavingAIPlan}
                      style={({ pressed }) => [
                        styles.lengthChip,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.inputBackground,
                          borderColor: isSelected ? theme.primary : theme.border,
                          opacity: pressed ? 0.94 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.lengthChipText, { color: isSelected ? theme.buttonText : theme.text }]}>{lengthValue} min</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Extra guidance</Text>
              <TextInput
                value={aiPlanForm.instructions}
                onChangeText={(value) => setAIPlanForm((currentValue) => ({ ...currentValue, instructions: value }))}
                editable={!isGeneratingAIPlan && !isSavingAIPlan}
                placeholder="Keep it balanced around school hours"
                placeholderTextColor={theme.textMuted}
                multiline
                style={[
                  styles.modalInput,
                  styles.multiLineInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />
            </View>

            {aiPlanError ? <Text style={[styles.formError, { color: theme.error }]}>{aiPlanError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeAIPlannerModal}
                disabled={isGeneratingAIPlan || isSavingAIPlan}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                    opacity: isGeneratingAIPlan || isSavingAIPlan ? 0.6 : pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={generateAIStudyPlan}
                disabled={isGeneratingAIPlan || isSavingAIPlan}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: isGeneratingAIPlan || isSavingAIPlan ? 0.7 : pressed ? 0.92 : 1,
                  },
                ]}
              >
                {isGeneratingAIPlan ? (
                  <ActivityIndicator size="small" color={theme.buttonText} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>{planningMode === 'single-day' ? 'Generate daily preview' : 'Generate weekly preview'}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAIPlanPreviewModal} transparent animationType="fade" onRequestClose={closeAIPlanPreview}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAIPlanPreview} />

          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{planningMode === 'single-day' ? 'Review your daily study plan' : 'Review your weekly study plan'}</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{aiPlanSessions.filter((session) => session.included).length} valid session{aiPlanSessions.filter((session) => session.included).length === 1 ? '' : 's'} selected</Text>
              </View>

              <Pressable onPress={closeAIPlanPreview} style={styles.modalCloseButton}>
                <Ionicons name="close-outline" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.aiPlanPreviewScroll} contentContainerStyle={styles.aiPlanPreviewContent} showsVerticalScrollIndicator={false}>
              {aiPlanSessions.map((session) => {
                const isIncluded = session.included;

                return (
                  <Pressable
                    key={session.id}
                    onPress={() => updateAiPlanSession(session.id, !isIncluded)}
                    style={({ pressed }) => [
                      styles.aiPlanSessionCard,
                      {
                        backgroundColor: isIncluded ? theme.inputBackground : 'rgba(127,127,127,0.08)',
                        borderColor: isIncluded ? theme.border : 'rgba(127,127,127,0.18)',
                        opacity: pressed ? 0.94 : 1,
                      },
                    ]}
                  >
                    <View style={styles.aiPlanSessionCopy}>
                      <Text style={[styles.aiPlanSessionTitle, { color: theme.text }]} numberOfLines={1}>{session.title}</Text>
                      <Text style={[styles.aiPlanSessionMeta, { color: theme.textMuted }]}>
                        {session.subject} â€¢ {formatAiFriendlyDate(parseDateInput(session.date) ?? selectedDate)}
                      </Text>
                      <Text style={[styles.aiPlanSessionMeta, { color: theme.textMuted }]}>
                        {formatTimeDisplay(session.startTime)} – {formatTimeDisplay(session.endTime)}
                      </Text>
                    </View>

                    <View style={[styles.aiPlanSessionToggle, { backgroundColor: isIncluded ? theme.primary : theme.inputBackground, borderColor: isIncluded ? theme.primary : theme.border }]}>
                      <Ionicons name={isIncluded ? 'checkmark' : 'remove'} size={16} color={isIncluded ? theme.buttonText : theme.textMuted} />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {aiPlanError ? <Text style={[styles.formError, { color: theme.error }]}>{aiPlanError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowAIPlanPreviewModal(false);
                  setShowAIPlannerModal(true);
                }}
                disabled={isSavingAIPlan}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                    opacity: isSavingAIPlan ? 0.6 : pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Regenerate</Text>
              </Pressable>

              <Pressable
                onPress={saveAIStudyPlan}
                disabled={isSavingAIPlan}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: isSavingAIPlan ? 0.7 : pressed ? 0.92 : 1,
                  },
                ]}
              >
                {isSavingAIPlan ? (
                  <ActivityIndicator size="small" color={theme.buttonText} />
                ) : (
                  <Text style={[styles.primaryButtonText, { color: theme.buttonText }]}>Save All Plans</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTaskFormModal}
        transparent
        animationType="fade"
        onRequestClose={closeTaskFormModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeTaskFormModal}
          />

          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.text },
                  ]}
                >
                  {editingTaskId
                    ? 'Edit Study Task'
                    : 'Add Study Task'}
                </Text>

                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: theme.textMuted },
                  ]}
                >
                  Add the deadline and estimated work. The
                  generator will schedule it later.
                </Text>
              </View>

              <Pressable
                onPress={closeTaskFormModal}
                style={styles.modalCloseButton}
              >
                <Ionicons
                  name="close-outline"
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.taskFormScroll}
              contentContainerStyle={styles.taskFormContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.textMuted },
                  ]}
                >
                  Task type
                </Text>

                <Pressable
                  onPress={() =>
                    setActiveTaskDropdown((currentValue) =>
                      currentValue === 'taskType'
                        ? null
                        : 'taskType',
                    )
                  }
                  style={({ pressed }) => [
                    styles.selectorButton,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor:
                        activeTaskDropdown === 'taskType'
                          ? theme.primary
                          : theme.border,
                      opacity: pressed ? 0.94 : 1,
                    },
                  ]}
                >
                  <View style={styles.selectorRow}>
                    <Ionicons
                      name={selectedTaskTypeIcon}
                      size={17}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.selectorButtonText,
                        { color: theme.text },
                      ]}
                    >
                      {selectedTaskTypeLabel}
                    </Text>
                  </View>

                  <Ionicons
                    name={
                      activeTaskDropdown === 'taskType'
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={16}
                    color={theme.textMuted}
                  />
                </Pressable>

                {activeTaskDropdown === 'taskType' ? (
                  <View
                    style={[
                      styles.taskDropdownPanel,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <ScrollView
                      style={styles.taskDropdownScroll}
                      nestedScrollEnabled
                    >
                      {TASK_TYPE_OPTIONS.map((option) => {
                        const isSelected =
                          option.value === taskForm.taskType;

                        return (
                          <Pressable
                            key={option.value}
                            onPress={() => {
                              setTaskForm((currentValue) => ({
                                ...currentValue,
                                taskType: option.value,
                              }));
                              setActiveTaskDropdown(null);
                            }}
                            style={({ pressed }) => [
                              styles.taskDropdownOption,
                              {
                                backgroundColor: isSelected
                                  ? theme.inputBackground
                                  : theme.surface,
                                opacity: pressed ? 0.92 : 1,
                              },
                            ]}
                          >
                            <Ionicons
                              name={option.icon}
                              size={17}
                              color={theme.primary}
                            />

                            <Text
                              style={[
                                styles.taskDropdownOptionText,
                                { color: theme.text },
                              ]}
                            >
                              {option.label}
                            </Text>

                            {isSelected ? (
                              <Ionicons
                                name="checkmark"
                                size={17}
                                color={theme.primary}
                              />
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.textMuted },
                  ]}
                >
                  Task title
                </Text>

                <TextInput
                  value={taskForm.title}
                  onChangeText={(value) =>
                    setTaskForm((currentValue) => ({
                      ...currentValue,
                      title: value,
                    }))
                  }
                  editable={!isSavingTask}
                  placeholder="Final machine learning report"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.textMuted },
                  ]}
                >
                  Subject
                </Text>

                <TextInput
                  value={taskForm.subject}
                  onChangeText={(value) =>
                    setTaskForm((currentValue) => ({
                      ...currentValue,
                      subject: value,
                    }))
                  }
                  editable={!isSavingTask}
                  placeholder="Machine Learning"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.textMuted },
                    ]}
                  >
                    Deadline date
                  </Text>

                  <Pressable
                    onPress={() =>
                      openPicker('date', 'task-form')
                    }
                    style={({ pressed }) => [
                      styles.selectorButton,
                      {
                        backgroundColor:
                          theme.inputBackground,
                        borderColor:
                          activePicker === 'date'
                            ? theme.primary
                            : theme.border,
                        opacity: pressed ? 0.94 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorButtonText,
                        { color: theme.text },
                      ]}
                      numberOfLines={1}
                    >
                      {dateFieldLabel}
                    </Text>

                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={theme.primary}
                    />
                  </Pressable>
                </View>

                <View style={styles.formGroupHalf}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.textMuted },
                    ]}
                  >
                    Deadline time
                  </Text>

                  <Pressable
                    onPress={() =>
                      setActiveTaskDropdown((currentValue) =>
                        currentValue === 'deadlineTime'
                          ? null
                          : 'deadlineTime',
                      )
                    }
                    style={({ pressed }) => [
                      styles.selectorButton,
                      {
                        backgroundColor:
                          theme.inputBackground,
                        borderColor:
                          activeTaskDropdown ===
                          'deadlineTime'
                            ? theme.primary
                            : theme.border,
                        opacity: pressed ? 0.94 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorButtonText,
                        { color: theme.text },
                      ]}
                    >
                      {formatTimeDisplay(
                        taskForm.deadlineTime,
                      )}
                    </Text>

                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={theme.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              {activeTaskDropdown === 'deadlineTime' ? (
                <View
                  style={[
                    styles.taskDropdownPanel,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <ScrollView
                    style={styles.taskDropdownScroll}
                    nestedScrollEnabled
                  >
                    {TIME_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setTaskForm((currentValue) => ({
                            ...currentValue,
                            deadlineTime: option.value,
                          }));
                          setActiveTaskDropdown(null);
                        }}
                        style={({ pressed }) => [
                          styles.taskDropdownOption,
                          {
                            backgroundColor:
                              option.value ===
                              taskForm.deadlineTime
                                ? theme.inputBackground
                                : theme.surface,
                            opacity: pressed ? 0.92 : 1,
                          },
                        ]}
                      >
                        <Ionicons
                          name="time-outline"
                          size={17}
                          color={theme.primary}
                        />

                        <Text
                          style={[
                            styles.taskDropdownOptionText,
                            { color: theme.text },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.textMuted },
                    ]}
                  >
                    Estimated study time
                  </Text>

                  <Pressable
                    onPress={() =>
                      setActiveTaskDropdown((currentValue) =>
                        currentValue === 'estimatedMinutes'
                          ? null
                          : 'estimatedMinutes',
                      )
                    }
                    style={({ pressed }) => [
                      styles.selectorButton,
                      {
                        backgroundColor:
                          theme.inputBackground,
                        borderColor:
                          activeTaskDropdown ===
                          'estimatedMinutes'
                            ? theme.primary
                            : theme.border,
                        opacity: pressed ? 0.94 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorButtonText,
                        { color: theme.text },
                      ]}
                    >
                      {selectedEstimatedTimeLabel}
                    </Text>

                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={theme.textMuted}
                    />
                  </Pressable>
                </View>

                <View style={styles.formGroupHalf}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.textMuted },
                    ]}
                  >
                    Priority
                  </Text>

                  <Pressable
                    onPress={() =>
                      setActiveTaskDropdown((currentValue) =>
                        currentValue === 'priority'
                          ? null
                          : 'priority',
                      )
                    }
                    style={({ pressed }) => [
                      styles.selectorButton,
                      {
                        backgroundColor:
                          theme.inputBackground,
                        borderColor:
                          activeTaskDropdown === 'priority'
                            ? theme.primary
                            : theme.border,
                        opacity: pressed ? 0.94 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorButtonText,
                        { color: theme.text },
                      ]}
                    >
                      {selectedPriorityLabel}
                    </Text>

                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={theme.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              {activeTaskDropdown ===
              'estimatedMinutes' ? (
                <View
                  style={[
                    styles.taskDropdownPanel,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {ESTIMATED_TIME_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setTaskForm((currentValue) => ({
                          ...currentValue,
                          estimatedMinutes: option.value,
                        }));
                        setActiveTaskDropdown(null);
                      }}
                      style={({ pressed }) => [
                        styles.taskDropdownOption,
                        {
                          backgroundColor:
                            option.value ===
                            taskForm.estimatedMinutes
                              ? theme.inputBackground
                              : theme.surface,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name="hourglass-outline"
                        size={17}
                        color={theme.primary}
                      />

                      <Text
                        style={[
                          styles.taskDropdownOptionText,
                          { color: theme.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {activeTaskDropdown === 'priority' ? (
                <View
                  style={[
                    styles.taskDropdownPanel,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setTaskForm((currentValue) => ({
                          ...currentValue,
                          priority: option.value,
                        }));
                        setActiveTaskDropdown(null);
                      }}
                      style={({ pressed }) => [
                        styles.taskDropdownOption,
                        {
                          backgroundColor:
                            option.value ===
                            taskForm.priority
                              ? theme.inputBackground
                              : theme.surface,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name="flag-outline"
                        size={17}
                        color={theme.primary}
                      />

                      <Text
                        style={[
                          styles.taskDropdownOptionText,
                          { color: theme.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View style={styles.formGroup}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.textMuted },
                  ]}
                >
                  Preferred study window
                </Text>

                <Text
                  style={[
                    styles.fieldHint,
                    { color: theme.textMuted },
                  ]}
                >
                  Tell the generator when you are normally
                  available to study.
                </Text>

                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Pressable
                      onPress={() =>
                        setActiveTaskDropdown(
                          (currentValue) =>
                            currentValue ===
                            'preferredStartTime'
                              ? null
                              : 'preferredStartTime',
                        )
                      }
                      style={({ pressed }) => [
                        styles.selectorButton,
                        {
                          backgroundColor:
                            theme.inputBackground,
                          borderColor:
                            activeTaskDropdown ===
                            'preferredStartTime'
                              ? theme.primary
                              : theme.border,
                          opacity: pressed ? 0.94 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectorButtonText,
                          { color: theme.text },
                        ]}
                      >
                        {formatTimeDisplay(
                          taskForm.preferredStartTime,
                        )}
                      </Text>

                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={theme.textMuted}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.formGroupHalf}>
                    <Pressable
                      onPress={() =>
                        setActiveTaskDropdown(
                          (currentValue) =>
                            currentValue ===
                            'preferredEndTime'
                              ? null
                              : 'preferredEndTime',
                        )
                      }
                      style={({ pressed }) => [
                        styles.selectorButton,
                        {
                          backgroundColor:
                            theme.inputBackground,
                          borderColor:
                            activeTaskDropdown ===
                            'preferredEndTime'
                              ? theme.primary
                              : theme.border,
                          opacity: pressed ? 0.94 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectorButtonText,
                          { color: theme.text },
                        ]}
                      >
                        {formatTimeDisplay(
                          taskForm.preferredEndTime,
                        )}
                      </Text>

                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={theme.textMuted}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>

              {activeTaskDropdown ===
              'preferredStartTime' ? (
                <View
                  style={[
                    styles.taskDropdownPanel,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <ScrollView
                    style={styles.taskDropdownScroll}
                    nestedScrollEnabled
                  >
                    {TIME_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setTaskForm((currentValue) => {
                            const nextEndTime =
                              addMinutesToTime(
                                option.value,
                                120,
                              ) ??
                              currentValue.preferredEndTime;

                            return {
                              ...currentValue,
                              preferredStartTime:
                                option.value,
                              preferredEndTime:
                                parseTimeToMinutes(
                                  currentValue.preferredEndTime,
                                ) !== null &&
                                parseTimeToMinutes(
                                  currentValue.preferredEndTime,
                                )! >
                                  parseTimeToMinutes(
                                    option.value,
                                  )!
                                  ? currentValue.preferredEndTime
                                  : nextEndTime,
                            };
                          });

                          setActiveTaskDropdown(null);
                        }}
                        style={({ pressed }) => [
                          styles.taskDropdownOption,
                          {
                            backgroundColor:
                              option.value ===
                              taskForm.preferredStartTime
                                ? theme.inputBackground
                                : theme.surface,
                            opacity: pressed ? 0.92 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskDropdownOptionText,
                            { color: theme.text },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {activeTaskDropdown ===
              'preferredEndTime' ? (
                <View
                  style={[
                    styles.taskDropdownPanel,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <ScrollView
                    style={styles.taskDropdownScroll}
                    nestedScrollEnabled
                  >
                    {getTimeOptionsAfter(
                      taskForm.preferredStartTime,
                    ).map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setTaskForm((currentValue) => ({
                            ...currentValue,
                            preferredEndTime: option.value,
                          }));
                          setActiveTaskDropdown(null);
                        }}
                        style={({ pressed }) => [
                          styles.taskDropdownOption,
                          {
                            backgroundColor:
                              option.value ===
                              taskForm.preferredEndTime
                                ? theme.inputBackground
                                : theme.surface,
                            opacity: pressed ? 0.92 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskDropdownOptionText,
                            { color: theme.text },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {formError ? (
                <Text
                  style={[
                    styles.formError,
                    { color: theme.error },
                  ]}
                >
                  {formError}
                </Text>
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeTaskFormModal}
                disabled={isSavingTask}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                    opacity: isSavingTask
                      ? 0.6
                      : pressed
                        ? 0.92
                        : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: theme.text },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  editingTaskId
                    ? saveEditedTask
                    : addTask
                }
                disabled={isSavingTask}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: isSavingTask
                      ? 0.7
                      : pressed
                        ? 0.92
                        : 1,
                  },
                ]}
              >
                {isSavingTask ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.buttonText}
                  />
                ) : (
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: theme.buttonText },
                    ]}
                  >
                    {editingTaskId
                      ? 'Save Changes'
                      : 'Save Study Task'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          (showTaskFormModal || showAIPlannerModal) &&
          activePicker === 'date'
        }
        transparent
        animationType="fade"
        onRequestClose={closeAllPickers}
      >
        <View style={styles.pickerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAllPickers} />

          <View style={[styles.calendarPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.pickerPanelHeader}>
              <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Date</Text>
              <Pressable onPress={closeAllPickers} style={styles.modalCloseButton}>
                <Ionicons name="close-outline" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={styles.calendarHeaderRow}>
              <Pressable
                onPress={() => setCalendarMonth((currentValue) => new Date(currentValue.getFullYear(), currentValue.getMonth() - 1, 1))}
                style={({ pressed }) => [styles.monthNavButton, { backgroundColor: theme.inputBackground, borderColor: theme.border, opacity: pressed ? 0.92 : 1 }]}
              >
                <Ionicons name="chevron-back" size={18} color={theme.textMuted} />
              </Pressable>

              <Text style={[styles.calendarMonthLabel, { color: theme.text }]}>{formatMonthLabel(calendarMonth)}</Text>

              <Pressable
                onPress={() => setCalendarMonth((currentValue) => new Date(currentValue.getFullYear(), currentValue.getMonth() + 1, 1))}
                style={({ pressed }) => [styles.monthNavButton, { backgroundColor: theme.inputBackground, borderColor: theme.border, opacity: pressed ? 0.92 : 1 }]}
              >
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={styles.calendarWeekLabels}>
              {WEEKDAY_LABELS.map((label) => (
                <Text key={label} style={[styles.calendarWeekLabel, { color: theme.textMuted }]}>{label}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarWeeks.map((day) => {
                const isCurrentMonth = isSameMonth(day, calendarMonth);
                const isSelected = sameDay(day, selectedCalendarDate);
                const isToday = sameDay(day, startOfDay(new Date()));

                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => {
                      if (!isCurrentMonth) {
                        setCalendarMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                      }
                      selectDateFromCalendar(day);
                    }}
                    style={({ pressed }) => [
                      styles.calendarDayButton,
                      {
                        opacity: isCurrentMonth ? (pressed ? 0.94 : 1) : 0.45,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.calendarDayCircle,
                        {
                          backgroundColor: isSelected ? theme.primary : 'transparent',
                          borderColor: isToday && !isSelected ? theme.primary : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[styles.calendarDayText, { color: isSelected ? theme.buttonText : theme.text }]}>
                        {day.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable onPress={closeAllPickers} style={({ pressed }) => [styles.pickerDoneButton, { backgroundColor: theme.primary, opacity: pressed ? 0.92 : 1 }]}>
              <Text style={[styles.pickerDoneText, { color: theme.buttonText }]}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          (showTaskFormModal || showAIPlannerModal) &&
          activeTimePickerList
        }
        transparent
        animationType="fade"
        onRequestClose={closeAllPickers}
      >
        <View style={styles.pickerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAllPickers} />

          <View style={[styles.timePanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.pickerPanelHeader}>
              <Text style={[styles.pickerTitle, { color: theme.text }]}>{activePickerTitle}</Text>
              <Pressable onPress={closeAllPickers} style={styles.modalCloseButton}>
                <Ionicons name="close-outline" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={[styles.activeTimePreview, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              <Ionicons name="time-outline" size={16} color={theme.primary} />
              <Text style={[styles.activeTimePreviewText, { color: theme.text }]}>Selected: {formatTimeDisplay(activeTimeFieldValue)}</Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.timeOptionsContent}
              style={styles.timeOptionsScroll}
            >
              {activeTimeOptions.length > 0 ? (
                activeTimeOptions.map((option) => {
                  const isSelected = option.value === activeTimeFieldValue;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => (activePicker === 'startTime' ? selectStartTime(option.value) : selectEndTime(option.value))}
                      style={({ pressed }) => [
                        styles.timeOptionButton,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.inputBackground,
                          borderColor: isSelected ? theme.primary : theme.border,
                          opacity: pressed ? 0.94 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.timeOptionText, { color: isSelected ? theme.buttonText : theme.text }]}>{option.label}</Text>
                      {isSelected ? <Ionicons name="checkmark" size={16} color={theme.buttonText} /> : null}
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.noTimeOptionsState}>
                  <Text style={[styles.noTimeOptionsText, { color: theme.textMuted }]}>No valid end times remain for the chosen start time.</Text>
                </View>
              )}
            </ScrollView>

            <Pressable onPress={closeAllPickers} style={({ pressed }) => [styles.pickerDoneButton, { backgroundColor: theme.primary, opacity: pressed ? 0.92 : 1 }]}>
              <Text style={[styles.pickerDoneText, { color: theme.buttonText }]}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showTaskActionsModal} transparent animationType="fade" onRequestClose={closeTaskActionsModal}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeTaskActionsModal} />

          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={[styles.sectionTitle, { color: theme.text }]} numberOfLines={2}>
                  {selectedTask?.title ?? 'Task'}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Choose an action for this plan.</Text>
              </View>

              <Pressable onPress={closeTaskActionsModal} style={styles.modalCloseButton}>
                <Ionicons name="close-outline" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            {selectedTask ? (
              <View style={[styles.taskPreviewCard, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                <Text style={[styles.taskPreviewTitle, { color: theme.text }]} numberOfLines={2}>
                  {selectedTask.title}
                </Text>
                <Text style={[styles.taskPreviewMeta, { color: theme.textMuted }]}>
                  {getStoredTaskDate(selectedTask) ? formatLongDay(getStoredTaskDate(selectedTask) as Date) : 'No date'}
                  {selectedTask.startTime && selectedTask.endTime ? ` â€¢ ${getTaskTimeRange(selectedTask)}` : ''}
                </Text>
              </View>
            ) : null}

            <View style={styles.actionList}>
              <Pressable
                onPress={() => handleTaskAction('toggleComplete')}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={selectedTask?.completed ? 'checkbox-outline' : 'checkmark-done-outline'}
                  size={18}
                  color={theme.primary}
                />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>
                  {selectedTask?.completed ? 'Mark incomplete' : 'Mark complete'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleTaskAction('edit')}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Ionicons name="create-outline" size={18} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Edit</Text>
              </Pressable>

              <Pressable
                onPress={() => handleTaskAction('delete')}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: 'rgba(217, 83, 79, 0.12)',
                    borderColor: 'rgba(217, 83, 79, 0.22)',
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Ionicons name="trash-outline" size={18} color="#D9534F" />
                <Text style={[styles.actionButtonText, { color: '#D9534F' }]}>Delete</Text>
              </Pressable>
            </View>

            <Pressable onPress={closeTaskActionsModal} style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.94 : 1 }]}>
              <Text style={[styles.cancelButtonText, { color: theme.textMuted }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pageWidth: {
    maxWidth: 840,
  },
  page: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl + 28,
  },
  headerRow: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: Spacing.md,
  },
  headerIcon: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 180,
  },
  title: {
    fontSize: Typography.title + 1,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: Typography.body - 1,
    lineHeight: 20,
    marginTop: 2,
  },
  addPlanButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 42,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 8,
  },
  addPlanButtonText: {
    fontSize: Typography.button,
    fontWeight: '800',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
    width: '100%',
  },
  aiPlanButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 42,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 8,
  },
  aiPlanButtonText: {
    color: '#F4F8FB',
    fontSize: Typography.button - 1,
    fontWeight: '800',
  },
  helperBar: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  helperBarText: {
    flex: 1,
    fontSize: Typography.caption + 1,
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.body + 1,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: Typography.caption + 1,
    lineHeight: 18,
    marginTop: 2,
  },
  todayButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    minWidth: 66,
    paddingHorizontal: 14,
  },
  todayButtonText: {
    fontSize: Typography.caption + 1,
    fontWeight: '800',
  },
  weekScroller: {
    marginHorizontal: -Spacing.md,
  },
  weekScrollerContent: {
    gap: 8,
    paddingHorizontal: Spacing.md,
  },
  weekDayButton: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  weekDayLabel: {
    fontSize: Typography.caption,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  weekDayNumber: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
    marginTop: 4,
  },
  todayDot: {
    borderRadius: 999,
    height: 6,
    marginTop: 8,
    width: 6,
  },
  todayDotSpacer: {
    height: 6,
    marginTop: 8,
    width: 6,
  },
  screenError: {
    fontSize: Typography.caption + 1,
    lineHeight: 18,
  },
  timelineCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  timelineBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  timelineBadgeText: {
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    minHeight: 140,
  },
  loadingText: {
    fontSize: Typography.caption + 1,
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.body + 1,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyStateCopy: {
    fontSize: Typography.caption + 1,
    lineHeight: 18,
    maxWidth: 320,
    textAlign: 'center',
  },
  timelineCanvas: {
    position: 'relative',
  },
  timelineRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  hourLabel: {
    fontSize: Typography.caption,
    fontWeight: '800',
    letterSpacing: 0.2,
    paddingTop: 10,
  },
  hourDivider: {
    borderTopWidth: 1,
    flex: 1,
    marginLeft: 10,
    marginTop: 17,
  },
  timelineTaskCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    elevation: 2,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  timelineTaskHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  timelineAccent: {
    borderRadius: 999,
    height: 28,
    marginTop: 1,
    width: 4,
  },
  timelineTaskCopy: {
    flex: 1,
    gap: 0,
  },
  timelineTaskTitle: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
    lineHeight: 18,
  },
  timelineTaskTime: {
    fontSize: Typography.caption,
    fontWeight: '700',
    lineHeight: 14,
  },
  taskStatusDot: {
    alignItems: 'center',
    borderRadius: 999,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  unscheduledCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  unscheduledHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  unscheduledList: {
    gap: 8,
  },
  unscheduledItem: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  unscheduledAccent: {
    borderRadius: 999,
    height: 18,
    width: 4,
  },
  unscheduledCopy: {
    flex: 1,
    gap: 2,
  },
  unscheduledTitle: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
    lineHeight: 20,
  },
  unscheduledMeta: {
    fontSize: Typography.caption,
    lineHeight: 16,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    marginHorizontal: 'auto' as never,
    maxWidth: 560,
    padding: Spacing.md + 2,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  segmentedControl: {
  flexDirection: 'row',
  gap: 8,
},

segmentButton: {
  alignItems: 'center',
  borderRadius: Radius.pill,
  borderWidth: 1,
  flex: 1,
  justifyContent: 'center',
  minHeight: 42,
  paddingHorizontal: Spacing.md,
  paddingVertical: 10,
},

segmentButtonText: {
  fontSize: Typography.caption + 1,
  fontWeight: '800',
  textAlign: 'center',
},
  modalHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  modalCloseButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  formGroup: {
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  formGroupHalf: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    fontSize: Typography.caption,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  modalInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: Typography.body,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  multiLineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  dayChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    minWidth: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dayChipText: {
    fontSize: Typography.caption + 1,
    fontWeight: '800',
  },
  lengthChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lengthChip: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  lengthChipText: {
    fontSize: Typography.caption + 1,
    fontWeight: '800',
  },
  aiPlanPreviewScroll: {
    maxHeight: 300,
  },
  aiPlanPreviewContent: {
    gap: 10,
  },
  aiPlanSessionCard: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  aiPlanSessionCopy: {
    flex: 1,
    gap: 4,
  },
  aiPlanSessionTitle: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
    lineHeight: 20,
  },
  aiPlanSessionMeta: {
    fontSize: Typography.caption + 1,
    lineHeight: 18,
  },
  aiPlanSessionToggle: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  datePreview: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
  },
  datePreviewText: {
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  selectorButton: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: Spacing.md,
  },
  selectorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  selectorButtonText: {
    flex: 1,
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  taskFormScroll: {
    maxHeight: 540,
  },

  taskFormContent: {
    gap: Spacing.md,
    paddingBottom: 4,
  },

  taskDropdownPanel: {
    borderRadius: Radius.md,
    borderWidth: 1,
    maxHeight: 210,
    overflow: 'hidden',
  },

  taskDropdownScroll: {
    maxHeight: 208,
  },

  taskDropdownOption: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },

  taskDropdownOptionText: {
    flex: 1,
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },

  fieldHint: {
    fontSize: Typography.caption,
    lineHeight: 17,
  },

  formError: {
    fontSize: Typography.caption + 1,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    minWidth: 106,
    paddingHorizontal: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: Typography.button,
    fontWeight: '800',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: 8,
    height: 46,
    justifyContent: 'center',
    minWidth: 128,
    paddingHorizontal: Spacing.md,
  },
  primaryButtonText: {
    fontSize: Typography.button,
    fontWeight: '800',
  },
  taskPreviewCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 4,
    padding: Spacing.md,
  },
  taskPreviewTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
    lineHeight: 20,
  },
  taskPreviewMeta: {
    fontSize: Typography.caption + 1,
    lineHeight: 18,
  },
  actionList: {
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
  },
  actionButtonText: {
    flex: 1,
    fontSize: Typography.body - 1,
    fontWeight: '800',
  },
  cancelButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    minHeight: 42,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.caption + 1,
    fontWeight: '800',
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  calendarPanel: {
    alignSelf: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    maxWidth: 420,
    padding: Spacing.md,
    width: '100%',
  },
  timePanel: {
    alignSelf: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    maxWidth: 360,
    padding: Spacing.md,
    width: '100%',
  },
  pickerPanelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  pickerTitle: {
    fontSize: Typography.body + 1,
    fontWeight: '800',
  },
  calendarHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  monthNavButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  calendarMonthLabel: {
    flex: 1,
    fontSize: Typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  calendarWeekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarWeekLabel: {
    flex: 1,
    fontSize: Typography.caption,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayButton: {
    alignItems: 'center',
    width: '14.2857%',
  },
  calendarDayCircle: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  calendarDayText: {
    fontSize: Typography.caption + 1,
    fontWeight: '800',
  },
  pickerDoneButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: Radius.pill,
    height: 44,
    justifyContent: 'center',
  },
  pickerDoneText: {
    fontSize: Typography.button,
    fontWeight: '800',
  },
  timeOptionsScroll: {
    maxHeight: 300,
  },
  timeOptionsContent: {
    gap: 8,
  },
  timeOptionButton: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  timeOptionText: {
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  activeTimePreview: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  activeTimePreviewText: {
    flex: 1,
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  noTimeOptionsState: {
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  noTimeOptionsText: {
    fontSize: Typography.caption + 1,
    lineHeight: 18,
    textAlign: 'center',
  },
});
