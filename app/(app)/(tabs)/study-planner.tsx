import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function StudyPlannerScreen() {
  const theme = useAuthTheme();
  const router = useRouter();

  return (
    <ScreenContainer scrollable>
      <View style={[styles.iconBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="calendar-outline" size={28} color={theme.primary} />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Smart Study Planner</Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>
        Organize your academic schedules, plan pomodoro intervals, track active streaks, and distribute assignments systematically.
      </Text>

      {/* Focus Session Integration Card */}
      <Pressable
        style={({ pressed }) => [
          styles.focusCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.primary,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }
        ]}
        onPress={() => router.push('/focus-session' as any)}
      >
        <View style={styles.focusHeader}>
          <View style={[styles.focusIconBg, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="hourglass" size={24} color={theme.primary} />
          </View>
          <View style={styles.focusContent}>
            <Text style={[styles.focusTitle, { color: theme.text }]}>Start Focus Session</Text>
            <Text style={[styles.focusDesc, { color: theme.textMuted }]}>
              Begin a 25-minute distraction-free Pomodoro timer block now.
            </Text>
          </View>
        </View>
        <View style={[styles.focusActionBtn, { backgroundColor: theme.primary }]}>
          <Text style={[styles.focusActionBtnText, { color: theme.buttonText }]}>Launch Timer</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.buttonText} />
        </View>
      </Pressable>

      <View style={[styles.placeholderCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Planner Overview</Text>
        <View style={styles.listItem}>
          <Ionicons name="alarm-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.textMuted }]}>Custom study intervals & Pomodoro timer</Text>
        </View>
        <View style={styles.listItem}>
          <Ionicons name="hourglass-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.textMuted }]}>Streak tracking & motivational milestones</Text>
        </View>
        <View style={styles.listItem}>
          <Ionicons name="stats-chart-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.textMuted }]}>Daily productivity graphs & analytical reports</Text>
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
    height: 64,
    justifyContent: 'center',
    width: 64,
    borderWidth: 1.5,
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
  focusCard: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  focusIconBg: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusContent: {
    flex: 1,
    gap: 2,
  },
  focusTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
  },
  focusDesc: {
    fontSize: Typography.caption + 1,
    lineHeight: 16,
  },
  focusActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: Radius.sm,
    gap: Spacing.xs,
  },
  focusActionBtnText: {
    fontSize: Typography.button,
    fontWeight: '700',
  },
  placeholderCard: {
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginTop: Spacing.md + 4,
    padding: Spacing.md + 2,
    borderWidth: 1,
    marginBottom: Spacing.xl,
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
    fontSize: Typography.body - 1,
    flex: 1,
  },
});
