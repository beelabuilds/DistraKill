import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

type StudyTask = {
  id: string;
  title: string;
  completed: boolean;
};

export default function StudyPlannerScreen() {
  const theme = useAuthTheme();
  const router = useRouter();

  const [taskTitle, setTaskTitle] = useState('');
  const [tasks, setTasks] = useState<StudyTask[]>([]);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Create task
  const addTask = () => {
    const trimmedTitle = taskTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    const newTask: StudyTask = {
      id: Date.now().toString(),
      title: trimmedTitle,
      completed: false,
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);
    setTaskTitle('');
  };

  // Mark task complete or incomplete
  const toggleTask = (taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  // Delete task
  const deleteTask = (taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId)
    );

    if (editingTaskId === taskId) {
      setEditingTaskId(null);
      setEditingTitle('');
    }
  };

  // Start editing task
  const startEditingTask = (task: StudyTask) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  // Save edited task
  const saveEditedTask = () => {
    const trimmedTitle = editingTitle.trim();

    if (!editingTaskId || !trimmedTitle) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === editingTaskId
          ? { ...task, title: trimmedTitle }
          : task
      )
    );

    setEditingTaskId(null);
    setEditingTitle('');
  };

  // Cancel editing
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

      {/* Task CRUD Card */}
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

        <TextInput
          value={taskTitle}
          onChangeText={setTaskTitle}
          onSubmitEditing={addTask}
          placeholder="For example: Study chapter 3"
          placeholderTextColor={theme.textMuted}
          returnKeyType="done"
          style={[
            styles.taskInput,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
        />

        <Pressable
          onPress={addTask}
          style={({ pressed }) => [
            styles.addTaskButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
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
        </Pressable>

        {tasks.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
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
                    onPress={() => toggleTask(task.id)}
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
            <Text style={[styles.focusTitle, { color: theme.text }]}>
              Start Focus Session
            </Text>

            <Text style={[styles.focusDescription, { color: theme.textMuted }]}>
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
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Planner Overview
        </Text>

        <View style={styles.listItem}>
          <Ionicons
            name="alarm-outline"
            size={18}
            color={theme.primary}
          />

          <Text style={[styles.listText, { color: theme.textMuted }]}>
            Custom study intervals &amp; Pomodoro timer
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons
            name="hourglass-outline"
            size={18}
            color={theme.primary}
          />

          <Text style={[styles.listText, { color: theme.textMuted }]}>
            Streak tracking &amp; motivational milestones
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons
            name="stats-chart-outline"
            size={18}
            color={theme.primary}
          />

          <Text style={[styles.listText, { color: theme.textMuted }]}>
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

  emptyText: {
    fontSize: Typography.caption + 1,
    marginTop: Spacing.xs,
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