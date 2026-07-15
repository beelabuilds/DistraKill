import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { PrimaryButton } from '@/components/auth/primary-button';
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

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access Hub</Text>
      
      <View style={styles.gridContainer}>
        {/* AI Assistant Quick Access */}
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
          onPress={() => router.push('/ai-assistant')}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="sparkles" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>AI Assistant</Text>
            <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
              Ask questions, summarize notes, and generate quizzes instantly.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.secondary} />
        </Pressable>

        {/* Study Planner Quick Access */}
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
          onPress={() => router.push('/study-planner')}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="calendar" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Study Planner</Text>
            <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
              Manage schedules, track streaks, and start Pomodoro focus sessions.
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
      </View>
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
});
