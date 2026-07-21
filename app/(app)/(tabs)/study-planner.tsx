import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import { db } from '@/config/firebase';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';

type StudyTask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

export default function StudyPlannerScreen() {
  const theme = useAuthTheme();
  const router = useRouter();
  const { user } = useAuth();

  const userId = user?.uid;

  const [taskTitle, setTaskTitle] = useState('');
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskError, setTaskError] = useState('');

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  /*
   * Load this user's tasks from Firestore.
   * The listener also receives changes automatically.
   */
  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    setTaskError('');

    const tasksReference = collection(
      db,
      'users',
      userId,
      'tasks'
    );

    const unsubscribe = onSnapshot(
      tasksReference,
      (snapshot) => {
        const loadedTasks: StudyTask[] = snapshot.docs.map(
          (taskDocument) => {
            const data = taskDocument.data();

            return {
              id: taskDocument.id,
              title:
                typeof data.title === 'string'
                  ? data.title
                  : 'Untitled task',
              completed: Boolean(data.completed),
              createdAt:
                typeof data.createdAt === 'number'
                  ? data.createdAt
                  : 0,
            };
          }
        );

        loadedTasks.sort(
          (firstTask, secondTask) =>
            firstTask.createdAt - secondTask.createdAt
        );

        setTasks(loadedTasks);
        setIsLoadingTasks(false);
      },
      (error) => {
        console.error('Failed to load study tasks:', error);
        setTaskError(
          'Could not load your tasks. Check your connection and Firestore rules.'
        );
        setIsLoadingTasks(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  // Create a task in Firestore
  const addTask = async () => {
    const trimmedTitle = taskTitle.trim();

    if (!userId || !trimmedTitle || isAddingTask) {
      return;
    }

    try {
      setIsAddingTask(true);
      setTaskError('');

      await addDoc(
        collection(db, 'users', userId, 'tasks'),
        {
          title: trimmedTitle,
          completed: false,
          createdAt: Date.now(),
        }
      );

      setTaskTitle('');
    } catch (error) {
      console.error('Failed to add task:', error);
      setTaskError('The task could not be added.');
    } finally {
      setIsAddingTask(false);
    }
  };

  // Mark a task complete or incomplete
  const toggleTask = async (task: StudyTask) => {
    if (!userId) {
      return;
    }

    try {
      setTaskError('');

      const taskReference = doc(
        db,
        'users',
        userId,
        'tasks',
        task.id
      );

      await updateDoc(taskReference, {
        completed: !task.completed,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      setTaskError('The task could not be updated.');
    }
  };

  // Delete a task from Firestore
  const deleteTask = async (taskId: string) => {
    if (!userId) {
      return;
    }

    try {
      setTaskError('');

      const taskReference = doc(
        db,
        'users',
        userId,
        'tasks',
        taskId
      );

      await deleteDoc(taskReference);

      if (editingTaskId === taskId) {
        setEditingTaskId(null);
        setEditingTitle('');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      setTaskError('The task could not be deleted.');
    }
  };

  // Open the task-editing input
  const startEditingTask = (task: StudyTask) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  // Save the edited title in Firestore
  const saveEditedTask = async () => {
    const trimmedTitle = editingTitle.trim();

    if (!userId || !editingTaskId || !trimmedTitle) {
      return;
    }

    try {
      setTaskError('');

      const taskReference = doc(
        db,
        'users',
        userId,
        'tasks',
        editingTaskId
      );

      await updateDoc(taskReference, {
        title: trimmedTitle,
      });

      setEditingTaskId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Failed to edit task:', error);
      setTaskError('The edited task could not be saved.');
    }
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingTitle('');
  };

  return (
    <ScreenContainer scrollable>
      <View
        style={[
          styles.iconBubble,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Ionicons
          name="calendar-outline"
          size={28}
          color={theme.primary}
        />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>
        Smart Study Planner
      </Text>

      <Text style={[styles.description, { color: theme.textMuted }]}>
        Organize your academic schedules, plan Pomodoro intervals, track active
        streaks, and distribute assignments systematically.
      </Text>

      {/* Firestore Task CRUD Card */}
      <View
        style={[
          styles.taskCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.taskCardTitle, { color: theme.text }]}>
          Add Study Task
        </Text>

        {!userId && (
          <Text style={[styles.warningText, { color: theme.textMuted }]}>
            Please sign in before adding study tasks.
          </Text>
        )}

        <TextInput
          value={taskTitle}
          onChangeText={setTaskTitle}
          onSubmitEditing={addTask}
          editable={Boolean(userId) && !isAddingTask}
          placeholder="For example: Study chapter 3"
          placeholderTextColor={theme.textMuted}
          returnKeyType="done"
          style={[
            styles.taskInput,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
              color: theme.text,
              opacity: userId ? 1 : 0.6,
            },
          ]}
        />

        <Pressable
          onPress={addTask}
          disabled={
            !userId ||
            !taskTitle.trim() ||
            isAddingTask
          }
          style={({ pressed }) => [
            styles.addTaskButton,
            {
              backgroundColor: theme.primary,
              opacity:
                !userId ||
                !taskTitle.trim() ||
                isAddingTask
                  ? 0.5
                  : pressed
                    ? 0.8
                    : 1,
            },
          ]}
        >
          {isAddingTask ? (
            <ActivityIndicator
              size="small"
              color={theme.buttonText}
            />
          ) : (
            <>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={theme.buttonText}
              />

              <Text
                style={[
                  styles.addTaskButtonText,
                  {
                    color: theme.buttonText,
                  },
                ]}
              >
                Add Task
              </Text>
            </>
          )}
        </Pressable>

        {taskError ? (
          <Text style={styles.errorText}>
            {taskError}
          </Text>
        ) : null}

        {isLoadingTasks ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={theme.primary}
            />

            <Text
              style={[
                styles.loadingText,
                { color: theme.textMuted },
              ]}
            >
              Loading your tasks...
            </Text>
          </View>
        ) : tasks.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              { color: theme.textMuted },
            ]}
          >
            No study tasks added yet.
          </Text>
        ) : (
          tasks.map((task) => (
            <View
              key={task.id}
              style={[
                styles.taskItem,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              {editingTaskId === task.id ? (
                <>
                  <TextInput
                    value={editingTitle}
                    onChangeText={setEditingTitle}
                    onSubmitEditing={saveEditedTask}
                    autoFocus
                    returnKeyType="done"
                    style={[
                      styles.editInput,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.primary,
                        color: theme.text,
                      },
                    ]}
                  />

                  <Pressable
                    onPress={saveEditedTask}
                    style={styles.iconButton}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={24}
                      color={theme.primary}
                    />
                  </Pressable>

                  <Pressable
                    onPress={cancelEditingTask}
                    style={styles.iconButton}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color={theme.textMuted}
                    />
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => toggleTask(task)}
                    style={styles.iconButton}
                  >
                    <Ionicons
                      name={
                        task.completed
                          ? 'checkbox-outline'
                          : 'square-outline'
                      }
                      size={23}
                      color={theme.primary}
                    />
                  </Pressable>

                  <Text
                    style={[
                      styles.taskText,
                      {
                        color: task.completed
                          ? theme.textMuted
                          : theme.text,
                        textDecorationLine: task.completed
                          ? 'line-through'
                          : 'none',
                      },
                    ]}
                  >
                    {task.title}
                  </Text>

                  <Pressable
                    onPress={() => startEditingTask(task)}
                    style={styles.iconButton}
                  >
                    <Ionicons
                      name="create-outline"
                      size={22}
                      color={theme.primary}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => deleteTask(task.id)}
                    style={styles.iconButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={21}
                      color="#D9534F"
                    />
                  </Pressable>
                </>
              )}
            </View>
          ))
        )}
      </View>

      {/* Focus Session Card */}
      <Pressable
        onPress={() => router.push('/focus-session' as never)}
        style={({ pressed }) => [
          styles.focusCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.primary,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <View style={styles.focusHeader}>
          <View
            style={[
              styles.focusIconBackground,
              {
                backgroundColor: theme.inputBackground,
              },
            ]}
          >
            <Ionicons
              name="hourglass"
              size={24}
              color={theme.primary}
            />
          </View>

          <View style={styles.focusContent}>
            <Text
              style={[
                styles.focusTitle,
                { color: theme.text },
              ]}
            >
              Start Focus Session
            </Text>

            <Text
              style={[
                styles.focusDescription,
                { color: theme.textMuted },
              ]}
            >
              Begin a 25-minute distraction-free Pomodoro timer block now.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.focusActionButton,
            {
              backgroundColor: theme.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.focusActionButtonText,
              {
                color: theme.buttonText,
              },
            ]}
          >
            Launch Timer
          </Text>

          <Ionicons
            name="arrow-forward"
            size={16}
            color={theme.buttonText}
          />
        </View>
      </Pressable>

      {/* Planner Overview */}
      <View
        style={[
          styles.placeholderCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <Text
          style={[
            styles.cardTitle,
            { color: theme.text },
          ]}
        >
          Planner Overview
        </Text>

        <View style={styles.listItem}>
          <Ionicons
            name="alarm-outline"
            size={18}
            color={theme.primary}
          />

          <Text
            style={[
              styles.listText,
              { color: theme.textMuted },
            ]}
          >
            Custom study intervals &amp; Pomodoro timer
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons
            name="hourglass-outline"
            size={18}
            color={theme.primary}
          />

          <Text
            style={[
              styles.listText,
              { color: theme.textMuted },
            ]}
          >
            Streak tracking &amp; motivational milestones
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons
            name="stats-chart-outline"
            size={18}
            color={theme.primary}
          />

          <Text
            style={[
              styles.listText,
              { color: theme.textMuted },
            ]}
          >
            Daily productivity graphs &amp; analytical reports
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  iconBubble: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },

  title: {
    fontSize: Typography.title + 4,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },

  description: {
    fontSize: Typography.body - 1,
    lineHeight: 22,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  taskCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    padding: Spacing.md,
  },

  taskCardTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
  },

  warningText: {
    fontSize: Typography.caption + 1,
  },

  taskInput: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    fontSize: Typography.body - 1,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  addTaskButton: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
    height: 46,
    justifyContent: 'center',
  },

  addTaskButtonText: {
    fontSize: Typography.button,
    fontWeight: '700',
  },

  loadingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },

  loadingText: {
    fontSize: Typography.caption + 1,
  },

  emptyText: {
    fontSize: Typography.caption + 1,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  errorText: {
    color: '#D9534F',
    fontSize: Typography.caption + 1,
    lineHeight: 18,
    textAlign: 'center',
  },

  taskItem: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    minHeight: 52,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },

  taskText: {
    flex: 1,
    fontSize: Typography.body - 1,
  },

  editInput: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    flex: 1,
    fontSize: Typography.body - 1,
    minHeight: 40,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },

  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 36,
  },

  focusCard: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.md,
    marginTop: Spacing.md + 4,
    padding: Spacing.md,
  },

  focusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },

  focusIconBackground: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },

  focusContent: {
    flex: 1,
    gap: 2,
  },

  focusTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
  },

  focusDescription: {
    fontSize: Typography.caption + 1,
    lineHeight: 16,
  },

  focusActionButton: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
    height: 44,
    justifyContent: 'center',
  },

  focusActionButtonText: {
    fontSize: Typography.button,
    fontWeight: '700',
  },

  placeholderCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    marginTop: Spacing.md + 4,
    padding: Spacing.md + 2,
  },

  cardTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
  },

  listItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  listText: {
    flex: 1,
    fontSize: Typography.body - 1,
  },
});