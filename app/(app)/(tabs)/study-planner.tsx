import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import { CalendarView } from '@/components/planner/calendar-strip';
import { TaskCreateModal } from '@/components/planner/task-create-modal';
import { TaskItem, type PlannerTask } from '@/components/planner/task-item';
import { db } from '@/config/firebase';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';
import { getTaskDateKey, isTaskCompleted } from '@/services/app-context-service';
import {
    pickPdfDocument,
    type TaskPdfAttachment,
} from '@/utils/pdf-utils';
import {
    formatFileSize,
    formatFriendlyDate,
    getTodayKey
} from '@/utils/planner-utils';

function deduplicateTasks(taskList: PlannerTask[]): PlannerTask[] {
  const seen = new Set<string>();
  const result: PlannerTask[] = [];
  for (const t of taskList) {
    if (t?.id && !seen.has(t.id)) {
      seen.add(t.id);
      result.push(t);
    }
  }
  return result;
}

export default function StudyPlannerScreen() {
  const theme = useAuthTheme();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.uid;

  // Selected date in "YYYY-MM-DD" format
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayKey());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pdf' | 'completed'>('all');

  // Quick Add state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPdf, setQuickPdf] = useState<TaskPdfAttachment | null>(null);
  const [isPickingQuickPdf, setIsPickingQuickPdf] = useState(false);
  const [isAddingQuick, setIsAddingQuick] = useState(false);

  // Detailed Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);

  // Data states
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Storage cache key
  const tasksCacheKey = useMemo(
    () => `@distrakill_calendar_tasks_${userId || 'guest'}`,
    [userId]
  );

  // 1. Load cached tasks from AsyncStorage for instant startup & offline support
  useEffect(() => {
    let isMounted = true;
    const loadCache = async () => {
      try {
        const cachedTasksRaw = await AsyncStorage.getItem(tasksCacheKey);
        if (isMounted && cachedTasksRaw) {
          try {
            const parsedTasks = JSON.parse(cachedTasksRaw);
            if (Array.isArray(parsedTasks)) {
              setTasks(deduplicateTasks(parsedTasks));
            }
          } catch (err) {
            console.error('Error parsing cached tasks:', err);
          }
        }
      } catch (err) {
        console.error('Failed reading planner offline cache:', err);
      }
    };

    void loadCache();
    return () => {
      isMounted = false;
    };
  }, [tasksCacheKey]);

  // 2. Realtime listener for Tasks from Firestore
  useEffect(() => {
    if (!userId) {
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    const tasksCollection = collection(db, 'users', userId, 'tasks');

    const unsubscribe = onSnapshot(
      tasksCollection,
      (snapshot) => {
        const loadedTasks: PlannerTask[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title:
              typeof data.title === 'string'
                ? data.title
                : 'Untitled study task',
            completed: isTaskCompleted(data),
            createdAt:
              typeof data.createdAt === 'number'
                ? data.createdAt
                : Date.now(),
            date: getTaskDateKey(data.date) ?? getTaskDateKey(data.createdAt) ?? '',
            subject:
              typeof data.subject === 'string' ? data.subject : 'General',
            priority:
              data.priority === 'low' ||
                data.priority === 'high' ||
                data.priority === 'medium'
                ? data.priority
                : 'medium',
            estimatedMinutes:
              typeof data.estimatedMinutes === 'number'
                ? data.estimatedMinutes
                : 25,
            pdfAttachment:
              data.pdfAttachment && typeof data.pdfAttachment === 'object'
                ? {
                  name: String(data.pdfAttachment.name || 'Document.pdf'),
                  uri: String(data.pdfAttachment.uri || ''),
                  size:
                    typeof data.pdfAttachment.size === 'number'
                      ? data.pdfAttachment.size
                      : undefined,
                  base64Uri:
                    typeof data.pdfAttachment.base64Uri === 'string'
                      ? data.pdfAttachment.base64Uri
                      : undefined,
                }
                : null,
          };
        });

        const uniqueLoaded = deduplicateTasks(loadedTasks);
        setTasks(uniqueLoaded);
        setIsLoadingTasks(false);

        // Update local cache
        void AsyncStorage.setItem(
          tasksCacheKey,
          JSON.stringify(uniqueLoaded)
        ).catch((err) => {
          console.error('Failed caching tasks to AsyncStorage:', err);
        });
      },
      (error) => {
        console.error('Firestore tasks listener error:', error);
        setIsLoadingTasks(false);
      }
    );

    return unsubscribe;
  }, [tasksCacheKey, userId]);

  // Map of total & completed tasks per date for calendar indicators
  const taskCountsByDate = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {};
    for (const t of tasks) {
      const d = t.date || getTodayKey();
      if (!counts[d]) {
        counts[d] = { total: 0, completed: 0 };
      }
      counts[d].total += 1;
      if (t.completed) {
        counts[d].completed += 1;
      }
    }
    return counts;
  }, [tasks]);

  // Map of tasks with PDF attachments per date for calendar indicators
  const docCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      if (t.pdfAttachment) {
        const d = t.date || getTodayKey();
        counts[d] = (counts[d] || 0) + 1;
      }
    }
    return counts;
  }, [tasks]);

  // Tasks for the currently selected date
  const selectedDateTasks = useMemo(() => {
    return tasks
      .filter((t) => t.date === selectedDate)
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return b.createdAt - a.createdAt;
      });
  }, [selectedDate, tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (activeFilter === 'pdf') {
      return selectedDateTasks.filter((t) => Boolean(t.pdfAttachment));
    }
    if (activeFilter === 'completed') {
      return selectedDateTasks.filter((t) => t.completed);
    }
    return selectedDateTasks;
  }, [activeFilter, selectedDateTasks]);

  // Counts for the day
  const totalTasks = selectedDateTasks.length;
  const completedTasks = selectedDateTasks.filter((t) => t.completed).length;
  const pdfTasksCount = selectedDateTasks.filter((t) => Boolean(t.pdfAttachment)).length;

  // Quick Add: Pick PDF
  const handleQuickPickPdf = async () => {
    try {
      setIsPickingQuickPdf(true);
      const picked = await pickPdfDocument();
      if (picked) {
        setQuickPdf(picked);
      }
    } catch (err) {
      console.error('Quick pick error:', err);
      Alert.alert('Error', 'Unable to pick PDF file.');
    } finally {
      setIsPickingQuickPdf(false);
    }
  };

  // Quick Add: Submit Task
  const handleQuickAddTask = async () => {
    const trimmed = quickTitle.trim();
    if (!trimmed || isAddingQuick) return;

    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to schedule study tasks.');
      return;
    }

    try {
      setIsAddingQuick(true);

      const sanitizedPdf = quickPdf
        ? {
          name: quickPdf.name,
          uri: quickPdf.uri,
          size: quickPdf.size ?? 0,
          base64Uri: quickPdf.base64Uri || null,
        }
        : null;

      const newTaskPayload: Record<string, any> = {
        title: trimmed,
        subject: 'General',
        priority: 'medium',
        estimatedMinutes: 25,
        date: selectedDate,
        completed: false,
        createdAt: Date.now(),
      };

      if (sanitizedPdf) {
        newTaskPayload.pdfAttachment = sanitizedPdf;
      }

      const docAdded = await addDoc(
        collection(db, 'users', userId, 'tasks'),
        newTaskPayload
      );

      // Optimistic local add
      const createdTask: PlannerTask = {
        id: docAdded.id,
        title: trimmed,
        subject: 'General',
        priority: 'medium',
        estimatedMinutes: 25,
        date: selectedDate,
        completed: false,
        createdAt: newTaskPayload.createdAt,
        pdfAttachment: quickPdf,
      };

      setTasks((prev) => deduplicateTasks([createdTask, ...prev]));
      setQuickTitle('');
      setQuickPdf(null);
    } catch (err) {
      console.error('Failed to quick add task:', err);
      Alert.alert('Error', 'Could not add task.');
    } finally {
      setIsAddingQuick(false);
    }
  };

  // Detailed modal save handler
  const handleSaveDetailedTask = useCallback(
    async (taskData: {
      id?: string;
      title: string;
      subject: string;
      priority: 'low' | 'medium' | 'high';
      estimatedMinutes: number;
      date: string;
      pdfAttachment?: TaskPdfAttachment | null;
    }) => {
      if (!userId) {
        Alert.alert('Sign In Required', 'Please sign in to save study tasks.');
        return;
      }

      try {
        setIsSavingTask(true);

        const sanitizedPdf = taskData.pdfAttachment
          ? {
            name: taskData.pdfAttachment.name,
            uri: taskData.pdfAttachment.uri,
            size: taskData.pdfAttachment.size ?? 0,
            base64Uri: taskData.pdfAttachment.base64Uri || null,
          }
          : null;

        if (taskData.id) {
          const taskRef = doc(db, 'users', userId, 'tasks', taskData.id);
          const updatePayload: Record<string, any> = {
            title: taskData.title,
            subject: taskData.subject,
            priority: taskData.priority,
            estimatedMinutes: taskData.estimatedMinutes,
            date: taskData.date,
          };

          if (sanitizedPdf) {
            updatePayload.pdfAttachment = sanitizedPdf;
          } else {
            updatePayload.pdfAttachment = null;
          }

          await updateDoc(taskRef, updatePayload);

          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskData.id
                ? {
                  ...t,
                  title: taskData.title,
                  subject: taskData.subject,
                  priority: taskData.priority,
                  estimatedMinutes: taskData.estimatedMinutes,
                  date: taskData.date,
                  pdfAttachment: taskData.pdfAttachment,
                }
                : t
            )
          );
        } else {
          const newTaskPayload: Record<string, any> = {
            title: taskData.title,
            subject: taskData.subject,
            priority: taskData.priority,
            estimatedMinutes: taskData.estimatedMinutes,
            date: taskData.date,
            completed: false,
            createdAt: Date.now(),
          };

          if (sanitizedPdf) {
            newTaskPayload.pdfAttachment = sanitizedPdf;
          }

          const docAdded = await addDoc(
            collection(db, 'users', userId, 'tasks'),
            newTaskPayload
          );

          const createdTask: PlannerTask = {
            id: docAdded.id,
            title: taskData.title,
            subject: taskData.subject,
            priority: taskData.priority,
            estimatedMinutes: taskData.estimatedMinutes,
            date: taskData.date,
            completed: false,
            createdAt: newTaskPayload.createdAt,
            pdfAttachment: taskData.pdfAttachment,
          };

          setTasks((prev) => deduplicateTasks([createdTask, ...prev]));
        }
      } catch (err) {
        console.error('Failed to save detailed task:', err);
        Alert.alert('Error', 'Unable to save task.');
      } finally {
        setIsSavingTask(false);
      }
    },
    [userId]
  );

  const handleToggleTask = useCallback(
    async (task: PlannerTask) => {
      if (!userId) return;
      const nextCompleted = !task.completed;

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t))
      );

      try {
        const taskRef = doc(db, 'users', userId, 'tasks', task.id);
        await updateDoc(taskRef, { completed: nextCompleted });
      } catch (err) {
        console.error('Failed to toggle task:', err);
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
        );
      }
    },
    [userId]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      if (!userId) return;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      try {
        const taskRef = doc(db, 'users', userId, 'tasks', taskId);
        await deleteDoc(taskRef);
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    },
    [userId]
  );

  return (
    <ScreenContainer authenticatedBackground scrollable contentStyle={{ paddingBottom: 85 }}>
      {/* Sleek Minimal Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.mainTitle, { color: theme.text }]}>
            Study Planner
          </Text>
          <Text style={[styles.subTitle, { color: theme.textMuted }]}>
            Focus agenda &amp; PDF attachments
          </Text>
        </View>

        <Pressable
          hitSlop={8}
          onPress={() => router.push('/focus-session' as any)}
          style={({ pressed }) => [
            styles.focusBtn,
            { backgroundColor: theme.primary },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="hourglass" size={14} color={theme.buttonText} />
          <Text style={[styles.focusBtnText, { color: theme.buttonText }]}>
            Focus
          </Text>
        </Pressable>
      </View>

      {/* Modern Calendar Strip with Fixed Week Navigation */}
      <CalendarView
        selectedDate={selectedDate}
        onSelectDate={(date) => setSelectedDate(date)}
        taskCountsByDate={taskCountsByDate}
        docCountsByDate={docCountsByDate}
        viewMode={viewMode}
        onChangeViewMode={(mode) => setViewMode(mode)}
      />

      {/* Date Title & Progress Line */}
      <View style={styles.dateHeaderRow}>
        <Text style={[styles.dateHeaderText, { color: theme.text }]}>
          {formatFriendlyDate(selectedDate)}
        </Text>

        {totalTasks > 0 ? (
          <View
            style={[
              styles.progressPill,
              {
                backgroundColor:
                  completedTasks === totalTasks
                    ? '#D1FAE5'
                    : theme.surfaceSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.progressPillText,
                {
                  color:
                    completedTasks === totalTasks
                      ? '#059669'
                      : theme.textMuted,
                },
              ]}
            >
              {completedTasks}/{totalTasks} done
            </Text>
          </View>
        ) : null}
      </View>

      {/* Clean Quick-Add Input Card */}
      <View
        style={[
          styles.quickAddContainer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.quickAddInputRow}>
          <TextInput
            value={quickTitle}
            onChangeText={setQuickTitle}
            onSubmitEditing={handleQuickAddTask}
            placeholder="Add a study task for this date..."
            placeholderTextColor={theme.textMuted}
            returnKeyType="done"
            style={[styles.quickTextInput, { color: theme.text }]}
          />

          {/* Quick PDF Attachment Button */}
          <Pressable
            hitSlop={8}
            disabled={isPickingQuickPdf}
            onPress={handleQuickPickPdf}
            style={({ pressed }) => [
              styles.quickActionIconBtn,
              quickPdf && { backgroundColor: '#FEE2E2' },
              pressed && styles.pressed,
            ]}
          >
            {isPickingQuickPdf ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons
                name={quickPdf ? 'document-text' : 'attach-outline'}
                size={20}
                color={quickPdf ? '#EF4444' : theme.textMuted}
              />
            )}
          </Pressable>

          {/* Open Detailed Modal */}
          <Pressable
            hitSlop={8}
            onPress={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            style={({ pressed }) => [
              styles.quickActionIconBtn,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="options-outline" size={19} color={theme.textMuted} />
          </Pressable>

          {/* Add Button */}
          <Pressable
            disabled={!quickTitle.trim() || isAddingQuick}
            onPress={handleQuickAddTask}
            style={({ pressed }) => [
              styles.quickAddSubmitBtn,
              {
                backgroundColor: theme.primary,
                opacity: quickTitle.trim() && !isAddingQuick ? 1 : 0.4,
              },
              pressed && styles.pressed,
            ]}
          >
            {isAddingQuick ? (
              <ActivityIndicator size="small" color={theme.buttonText} />
            ) : (
              <Ionicons name="add" size={18} color={theme.buttonText} />
            )}
          </Pressable>
        </View>

        {/* Selected PDF preview chip under quick add input */}
        {quickPdf ? (
          <View style={styles.quickPdfPreviewRow}>
            <View style={styles.quickPdfChip}>
              <Ionicons name="document-text" size={12} color="#EF4444" />
              <Text
                numberOfLines={1}
                style={[styles.quickPdfChipText, { color: theme.text }]}
              >
                {quickPdf.name} ({formatFileSize(quickPdf.size)})
              </Text>
              <Pressable
                hitSlop={6}
                onPress={() => setQuickPdf(null)}
                style={styles.quickPdfRemove}
              >
                <Ionicons name="close-circle" size={14} color={theme.textMuted} />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      {/* Filter Tabs (Compact and quiet) */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setActiveFilter('all')}
          style={[
            styles.filterChip,
            activeFilter === 'all' && [
              styles.filterChipActive,
              { borderColor: theme.primary, backgroundColor: theme.primary + '14' },
            ],
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color: activeFilter === 'all' ? theme.primary : theme.textMuted,
                fontWeight: activeFilter === 'all' ? '700' : '500',
              },
            ]}
          >
            All ({totalTasks})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('pdf')}
          style={[
            styles.filterChip,
            activeFilter === 'pdf' && [
              styles.filterChipActive,
              { borderColor: '#EF4444', backgroundColor: '#FEE2E2' },
            ],
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color: activeFilter === 'pdf' ? '#EF4444' : theme.textMuted,
                fontWeight: activeFilter === 'pdf' ? '700' : '500',
              },
            ]}
          >
            With PDFs ({pdfTasksCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('completed')}
          style={[
            styles.filterChip,
            activeFilter === 'completed' && [
              styles.filterChipActive,
              { borderColor: '#10B981', backgroundColor: '#D1FAE5' },
            ],
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color: activeFilter === 'completed' ? '#059669' : theme.textMuted,
                fontWeight: activeFilter === 'completed' ? '700' : '500',
              },
            ]}
          >
            Done ({completedTasks})
          </Text>
        </Pressable>
      </View>

      {/* Task List */}
      <View style={styles.tasksContainer}>
        {isLoadingTasks && tasks.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>
              Loading tasks...
            </Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name={
                activeFilter === 'pdf'
                  ? 'document-text-outline'
                  : 'checkmark-done-circle-outline'
              }
              size={28}
              color={theme.textMuted}
            />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {activeFilter === 'pdf'
                ? 'No tasks with PDFs for this day'
                : activeFilter === 'completed'
                  ? 'No completed tasks yet'
                  : 'No tasks scheduled for this day'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task, index) => (
            <TaskItem
              key={`${task.id}-${index}`}
              task={task}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={(t) => {
                setEditingTask(t);
                setIsTaskModalOpen(true);
              }}
            />
          ))
        )}
      </View>

      {/* Modal for Detailed Task Creation / Editing */}
      <TaskCreateModal
        visible={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        selectedDate={selectedDate}
        taskToEdit={editingTask}
        onSubmit={handleSaveDetailedTask}
        loading={isSavingTask}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
    paddingTop: 4,
  },
  mainTitle: {
    fontSize: Typography.title,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subTitle: {
    fontSize: Typography.caption,
    fontWeight: '500',
    marginTop: 1,
  },
  focusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  focusBtnText: {
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  dateHeaderText: {
    fontSize: Typography.body,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  progressPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  progressPillText: {
    fontSize: Typography.caption - 1,
    fontWeight: '700',
  },
  quickAddContainer: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: Spacing.xs + 4,
    gap: 6,
  },
  quickAddInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickTextInput: {
    flex: 1,
    fontSize: Typography.body - 1,
    paddingVertical: 6,
  },
  quickActionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddSubmitBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPdfPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 2,
  },
  quickPdfChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    maxWidth: '90%',
  },
  quickPdfChipText: {
    fontSize: Typography.caption - 1,
    fontWeight: '600',
    flexShrink: 1,
  },
  quickPdfRemove: {
    padding: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  filterChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: Typography.caption - 1,
  },
  tasksContainer: {
    gap: 8,
    marginBottom: Spacing.xl,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.caption + 1,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.caption + 1,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});