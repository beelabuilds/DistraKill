import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/primary-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAuthTheme();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.headerRow}>
        <View style={styles.avatarBubble}>
          <Text style={styles.avatarText}>{(user?.name ?? 'S').slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: theme.secondary }]}>Signed in</Text>
          <Text style={[styles.title, { color: theme.text }]}>Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: theme.textMuted }]}>This is a temporary home screen you can replace with the real student dashboard later.</Text>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardRow}>
          <Ionicons name="book-outline" size={20} color={theme.primary} />
          <Text style={[styles.cardText, { color: theme.text }]}>Focus session ready for today</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="alarm-outline" size={20} color={theme.primary} />
          <Text style={[styles.cardText, { color: theme.text }]}>Your next study reminder can live here</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="list-outline" size={20} color={theme.primary} />
          <Text style={[styles.cardText, { color: theme.text }]}>Tasks, habits, and streaks can be added later</Text>
        </View>
      </View>

      <PrimaryButton label="Logout" tone="secondary" onPress={handleLogout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatarBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.12)',
    borderRadius: Radius.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: {
    color: '#4F46E5',
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
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: Typography.title + 6,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  description: {
    fontSize: Typography.body,
    lineHeight: 24,
    marginTop: Spacing.md,
  },
  card: {
    borderRadius: Radius.lg,
    gap: Spacing.md,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    shadowColor: '#10213A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  cardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardText: {
    flex: 1,
    fontSize: Typography.body,
    lineHeight: 22,
  },
});
