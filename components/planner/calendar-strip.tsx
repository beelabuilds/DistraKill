import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';
import {
  formatDateKey,
  formatMonthYear,
  getTodayKey,
  parseDateKey,
} from '@/utils/planner-utils';

type CalendarProps = {
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (dateKey: string) => void;
  taskCountsByDate: Record<string, { total: number; completed: number }>;
  docCountsByDate: Record<string, number>;
  viewMode: 'month' | 'week';
  onChangeViewMode: (mode: 'month' | 'week') => void;
};

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({
  selectedDate,
  onSelectDate,
  taskCountsByDate,
  docCountsByDate,
  viewMode,
  onChangeViewMode,
}: CalendarProps) {
  const theme = useAuthTheme();
  const todayKey = getTodayKey();
  const currentDate = useMemo(() => parseDateKey(selectedDate), [selectedDate]);

  // Current viewed month date for Month View
  const [viewDate, setViewDate] = React.useState<Date>(() => parseDateKey(selectedDate));

  // Sync viewDate when selectedDate month changes
  React.useEffect(() => {
    const parsed = parseDateKey(selectedDate);
    if (
      parsed.getMonth() !== viewDate.getMonth() ||
      parsed.getFullYear() !== viewDate.getFullYear()
    ) {
      setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arrow navigation: Previous (Week or Month)
  const handlePrev = () => {
    if (viewMode === 'week') {
      const prevWeekDate = new Date(currentDate);
      prevWeekDate.setDate(prevWeekDate.getDate() - 7);
      onSelectDate(formatDateKey(prevWeekDate));
    } else {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    }
  };

  // Arrow navigation: Next (Week or Month)
  const handleNext = () => {
    if (viewMode === 'week') {
      const nextWeekDate = new Date(currentDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      onSelectDate(formatDateKey(nextWeekDate));
    } else {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(todayKey);
  };

  // Dynamic header title based on current view
  const headerTitle = useMemo(() => {
    if (viewMode === 'week') {
      return currentDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
    }
    return formatMonthYear(viewDate);
  }, [currentDate, viewDate, viewMode]);

  // Month grid calculations
  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDaysCount = new Date(year, month, 0).getDate();

    const days: {
      key: string;
      dayNumber: number;
      isCurrentMonth: boolean;
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDaysCount - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        key: formatDateKey(prevDate),
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const thisDate = new Date(year, month, day);
      days.push({
        key: formatDateKey(thisDate),
        dayNumber: day,
        isCurrentMonth: true,
      });
    }

    // Trailing days to round to complete week
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        key: formatDateKey(nextDate),
        dayNumber: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewDate]);

  // Week strip calculations (week containing selectedDate)
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days: { key: string; dayNumber: number; dayName: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push({
        key: formatDateKey(d),
        dayNumber: d.getDate(),
        dayName: WEEKDAY_NAMES[i],
      });
    }
    return days;
  }, [currentDate]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {/* Header Row: Month/Year + Arrows + Today + Mode Switch */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithArrows}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {headerTitle}
          </Text>

          <View style={styles.arrowGroup}>
            <Pressable
              hitSlop={10}
              onPress={handlePrev}
              style={({ pressed }) => [
                styles.arrowBtn,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="chevron-back" size={16} color={theme.text} />
            </Pressable>

            <Pressable
              hitSlop={10}
              onPress={handleNext}
              style={({ pressed }) => [
                styles.arrowBtn,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="chevron-forward" size={16} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.controlsGroup}>
          <Pressable
            hitSlop={8}
            onPress={handleJumpToToday}
            style={({ pressed }) => [
              styles.todayBtn,
              {
                borderColor: selectedDate === todayKey ? theme.primary : theme.border,
                backgroundColor:
                  selectedDate === todayKey
                    ? theme.primary + '18'
                    : theme.surfaceSoft,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.todayBtnText,
                {
                  color: selectedDate === todayKey ? theme.primary : theme.text,
                },
              ]}
            >
              Today
            </Text>
          </Pressable>

          <Pressable
            hitSlop={8}
            onPress={() =>
              onChangeViewMode(viewMode === 'month' ? 'week' : 'month')
            }
            style={({ pressed }) => [
              styles.modePill,
              { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={viewMode === 'month' ? 'calendar-outline' : 'grid-outline'}
              size={13}
              color={theme.primary}
            />
            <Text style={[styles.modePillText, { color: theme.primary }]}>
              {viewMode === 'month' ? 'Week' : 'Month'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Weekday Labels (Month View only) */}
      {viewMode === 'month' ? (
        <View style={styles.weekdayRow}>
          {WEEKDAY_NAMES.map((w, index) => (
            <Text
              key={w + index}
              style={[
                styles.weekdayText,
                {
                  color:
                    index === 0 || index === 6
                      ? theme.textMuted
                      : theme.secondary,
                },
              ]}
            >
              {w}
            </Text>
          ))}
        </View>
      ) : null}

      {/* View Mode: Month Grid */}
      {viewMode === 'month' ? (
        <View style={styles.gridContainer}>
          {monthDays.map((item) => {
            const isSelected = item.key === selectedDate;
            const isToday = item.key === todayKey;
            const taskInfo = taskCountsByDate[item.key];
            const docCount = docCountsByDate[item.key] || 0;
            const hasTasks = taskInfo && taskInfo.total > 0;
            const allTasksCompleted = hasTasks && taskInfo.completed === taskInfo.total;

            return (
              <Pressable
                key={item.key}
                onPress={() => onSelectDate(item.key)}
                style={({ pressed }) => [
                  styles.dayCell,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.dayBubble,
                    isToday &&
                      !isSelected && [
                        styles.todayBorder,
                        { borderColor: theme.primary },
                      ],
                    isSelected && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isSelected
                          ? theme.buttonText
                          : item.isCurrentMonth
                          ? theme.text
                          : theme.textMuted + '55',
                        fontWeight: isSelected || isToday ? '800' : '500',
                      },
                    ]}
                  >
                    {item.dayNumber}
                  </Text>

                  {/* Indicators below day number */}
                  <View style={styles.indicatorRow}>
                    {hasTasks ? (
                      <View
                        style={[
                          styles.dotIndicator,
                          {
                            backgroundColor: isSelected
                              ? '#FFFFFF'
                              : allTasksCompleted
                              ? '#10B981'
                              : '#F59E0B',
                          },
                        ]}
                      />
                    ) : null}

                    {docCount > 0 ? (
                      <View
                        style={[
                          styles.docIndicator,
                          {
                            backgroundColor: isSelected ? '#FFFFFF' : '#EF4444',
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        /* View Mode: Week Strip */
        <View style={styles.weekStripRow}>
          {weekDays.map((item) => {
            const isSelected = item.key === selectedDate;
            const isToday = item.key === todayKey;
            const taskInfo = taskCountsByDate[item.key];
            const docCount = docCountsByDate[item.key] || 0;
            const hasTasks = taskInfo && taskInfo.total > 0;
            const allTasksCompleted = hasTasks && taskInfo.completed === taskInfo.total;

            return (
              <Pressable
                key={item.key}
                onPress={() => onSelectDate(item.key)}
                style={({ pressed }) => [
                  styles.weekPill,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.surfaceSoft,
                    borderColor: isToday && !isSelected ? theme.primary : theme.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.weekPillDayName,
                    {
                      color: isSelected ? theme.buttonText : theme.textMuted,
                    },
                  ]}
                >
                  {item.dayName}
                </Text>
                <Text
                  style={[
                    styles.weekPillDayNum,
                    {
                      color: isSelected ? theme.buttonText : theme.text,
                    },
                  ]}
                >
                  {item.dayNumber}
                </Text>

                <View style={styles.indicatorRow}>
                  {hasTasks ? (
                    <View
                      style={[
                        styles.dotIndicator,
                        {
                          backgroundColor: isSelected
                            ? '#FFFFFF'
                            : allTasksCompleted
                            ? '#10B981'
                            : '#F59E0B',
                        },
                      ]}
                    />
                  ) : null}
                  {docCount > 0 ? (
                    <View
                      style={[
                        styles.docIndicator,
                        {
                          backgroundColor: isSelected ? '#FFFFFF' : '#EF4444',
                        },
                      ]}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.sm + 2,
    gap: Spacing.xs + 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  titleWithArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: Typography.body + 1,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  arrowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  todayBtnText: {
    fontSize: Typography.caption - 1,
    fontWeight: '700',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  modePillText: {
    fontSize: Typography.caption - 1,
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.caption - 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 1,
  },
  todayBorder: {
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: Typography.body - 2,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 4,
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  docIndicator: {
    width: 4,
    height: 4,
    borderRadius: 1,
  },
  weekStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    paddingTop: 2,
  },
  weekPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 2,
  },
  weekPillDayName: {
    fontSize: Typography.caption - 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  weekPillDayNum: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
