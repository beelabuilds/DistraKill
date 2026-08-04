import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAuthTheme();
  const { user } = useAuth();

  return (
    <ScreenContainer scrollable>
      <View style={styles.headerRow}>
        <View style={[styles.avatarBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.avatarText, { color: theme.primary }]}>
            {(user?.name ?? 'S').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: theme.secondary }]}>Student Dashboard</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
          </Text>
        </View>
      </View>

      {/* 📊 Academic Stats Row */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="flame-outline" size={20} color="#FF6B6B" />
          <Text style={[styles.statValue, { color: theme.text }]}>5 Days</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Streak</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="time-outline" size={20} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>14.2 hrs</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Studied</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="checkmark-done-circle-outline" size={20} color="#4ADE80" />
          <Text style={[styles.statValue, { color: theme.text }]}>28</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Tasks</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Focus & Peace</Text>

      <View style={styles.gridContainer}>
        {/* Islamic Duaa Library Quick Access */}
        <Pressable
          style={({ pressed }) => [
            styles.dashboardCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }]
            }
          ]}
          onPress={() => router.push('/islamic-duaa' as any)}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="book" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Islamic Duaa Library</Text>
            <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
              Read and listen to daily prayers & supplications for focus & peace.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.secondary} />
        </Pressable>

        {/* Focus Session Quick Access */}
        <Pressable
          style={({ pressed }) => [
            styles.dashboardCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }]
            }
          ]}
          onPress={() => router.push('/focus-session' as any)}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="hourglass" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Focus Session</Text>
            <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
              Start a 25-minute distraction-free Pomodoro timer block now.
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
    marginBottom: Spacing.lg,
  },
  avatarBubble: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
    borderWidth: 1.5,
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
    marginBottom: Spacing.xs - 4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: Typography.title + 2,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  sectionTitle: {
    fontSize: Typography.body + 2,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: Spacing.md,
  },
  gridContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
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
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: Typography.caption + 1,
    lineHeight: 16,
  },
  logoutWrapper: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
    marginTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
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
  },
});
