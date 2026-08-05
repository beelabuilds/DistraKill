import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
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

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAuthTheme();
  const { user } = useAuth();
  const userId = user?.uid;

  // Real-time Tasks State
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Focus Stats State
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  // Profile Avatar State
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [profileName, setProfileName] = useState(user?.name ?? 'Student');

  // Load Focus Stats & Profile from AsyncStorage
  const loadLocalData = async () => {
    try {
      const focusData = await AsyncStorage.getItem('@distrakill_focus_stats');
      if (focusData) {
        const parsed = JSON.parse(focusData);
        if (parsed.totalMinutes !== undefined) setFocusMinutes(parsed.totalMinutes);
        if (parsed.sessionCount !== undefined) setSessionCount(parsed.sessionCount);
      }

      const profileData = await AsyncStorage.getItem('@distrakill_user_profile');
      if (profileData) {
        const parsed = JSON.parse(profileData);
        if (parsed.avatarUri) setAvatarUri(parsed.avatarUri);
        if (parsed.name) setProfileName(parsed.name);
      }
    } catch (e) {
      console.log('Error loading home data:', e);
    }
  };

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLocalData();
    }, [])
  );

  // Listen to Firestore Tasks in Realtime
  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    const tasksRef = collection(db, 'users', userId, 'tasks');

    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const loadedTasks: StudyTask[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: typeof data.title === 'string' ? data.title : 'Untitled task',
            completed: Boolean(data.completed),
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
          };
        });

        loadedTasks.sort((a, b) => b.createdAt - a.createdAt);
        setTasks(loadedTasks);
        setIsLoadingTasks(false);
      },
      (error) => {
        console.error('Error fetching tasks:', error);
        setIsLoadingTasks(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  // Toggle task completion from dashboard
  const handleToggleTask = async (task: StudyTask) => {
    if (!userId) return;
    try {
      const taskDocRef = doc(db, 'users', userId, 'tasks', task.id);
      await updateDoc(taskDocRef, {
        completed: !task.completed,
      });
    } catch (err) {
      console.error('Error updating task state:', err);
    }
  };

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Format Focus Hours
  const formatFocusTime = (totalMins: number) => {
    if (totalMins < 60) return `${totalMins} mins`;
    const hours = (totalMins / 60).toFixed(1);
    return `${hours} hrs`;
  };

  return (
    <ScreenContainer scrollable>
      {/* 👤 Dynamic Header Row */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.push('/(app)/(tabs)/profile' as any)}>
          <View style={[styles.avatarBubble, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.primary }]}>
                {(profileName || 'S').slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: theme.secondary }]}>Student Dashboard</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Welcome back, {profileName.split(' ')[0]} 👋
          </Text>
        </View>
      </View>

      {/* 📊 Real Work Stats Row */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="time-outline" size={20} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{formatFocusTime(focusMinutes)}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Focus Time</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="hourglass-outline" size={20} color="#F59E0B" />
          <Text style={[styles.statValue, { color: theme.text }]}>{sessionCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Sessions</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="checkmark-done-circle-outline" size={20} color="#10B981" />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {completedTasks}/{totalTasks}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Tasks Done</Text>
        </View>
      </View>

      {/* 📈 Real Progress Bar Card */}
      <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: theme.text }]}>Daily Task Progress</Text>
          <Text style={[styles.progressPercent, { color: theme.primary }]}>{completionPercentage}%</Text>
        </View>

        <View style={[styles.progressBarBg, { backgroundColor: theme.surfaceSoft }]}>
          <View
            style={[
              styles.progressBarFill,
              { backgroundColor: theme.primary, width: `${completionPercentage}%` },
            ]}
          />
        </View>

        <Text style={[styles.progressSub, { color: theme.textMuted }]}>
          {totalTasks === 0
            ? 'No tasks created yet. Plan your day in Study Planner!'
            : completedTasks === totalTasks
            ? 'All tasks completed! Amazing work 🎉'
            : `${completedTasks} of ${totalTasks} tasks finished. Keep going!`}
        </Text>
      </View>

      {/* 🚀 Quick Access Tools */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Quick Actions & Tools
      </Text>

      <View style={styles.gridContainer}>
        {/* Focus Session Quick Access */}
        <Pressable
          style={({ pressed }) => [
            styles.dashboardCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => router.push('/focus-session' as any)}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.surfaceSoft }]}>
            <Ionicons name="hourglass-outline" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Focus Session</Text>
            <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
              Start a timer-driven Pomodoro focus session.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.secondary} />
        </Pressable>

        {/* Islamic Duaa Library Quick Access */}
        <Pressable
          style={({ pressed }) => [
            styles.dashboardCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => router.push('/islamic-duaa' as any)}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.surfaceSoft }]}>
            <Ionicons name="book-outline" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Islamic Duaa Companion</Text>
            <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
              Authentic prayers & supplications for focus & peace.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.secondary} />
        </Pressable>
      </View>

      <View style={{ height: 100 }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarBubble: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 54,
    justifyContent: 'center',
    width: 54,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: Typography.title,
    fontWeight: '800',
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    fontSize: Typography.caption,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: Typography.title - 2,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 2,
  },
  statValue: {
    fontSize: Typography.body,
    fontWeight: '800',
    marginTop: 2,
  },
  statLabel: {
    fontSize: Typography.caption,
    fontWeight: '600',
  },
  progressCard: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.xs + 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  progressSub: {
    fontSize: Typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.body + 1,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  seeAllText: {
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },
  loadingBox: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTaskCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.body,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: Typography.caption + 1,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    marginTop: Spacing.xs,
  },
  addTaskBtnText: {
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },
  tasksList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  taskItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  checkboxTouch: {
    padding: 2,
  },
  taskItemTitle: {
    flex: 1,
    fontSize: Typography.body - 1,
    fontWeight: '600',
  },
  gridContainer: {
    gap: Spacing.sm + 2,
  },
  dashboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: Typography.caption,
    lineHeight: 16,
  },
});

