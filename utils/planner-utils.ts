/**
 * Utility functions for Calendar & Study Planner
 */

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

export function formatFriendlyDate(dateKey: string): string {
  try {
    const date = parseDateKey(dateKey);
    const today = getTodayKey();
    const yesterday = formatDateKey(new Date(Date.now() - 86400000));
    const tomorrow = formatDateKey(new Date(Date.now() + 86400000));

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    const formatted = date.toLocaleDateString(undefined, options);

    if (dateKey === today) {
      return `Today, ${formatted}`;
    }
    if (dateKey === tomorrow) {
      return `Tomorrow, ${formatted}`;
    }
    if (dateKey === yesterday) {
      return `Yesterday, ${formatted}`;
    }
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateKey;
  }
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const SUBJECT_OPTIONS = [
  'General',
  'Mathematics',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Literature',
  'Economics',
  'Other',
] as const;

export type SubjectType = (typeof SUBJECT_OPTIONS)[number] | string;

export const PRIORITY_COLORS = {
  high: {
    bg: '#FEE2E2',
    text: '#EF4444',
    border: '#FCA5A5',
  },
  medium: {
    bg: '#FEF3C7',
    text: '#F59E0B',
    border: '#FCD34D',
  },
  low: {
    bg: '#D1FAE5',
    text: '#10B981',
    border: '#6EE7B7',
  },
} as const;
