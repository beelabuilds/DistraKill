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
        <View style={[styles.avatarBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.avatarText, { color: theme.primary }]}>{(user?.name ?? 'S').slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: theme.secondary }]}>Signed in</Text>
          <Text style={[styles.title, { color: theme.text }]}>Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: theme.textMuted }]}>This is a temporary home screen you can replace with the real student dashboard later.</Text>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardRow}>
          <Ionicons name="book-outline" size={18} color={theme.primary} />
          <Text style={[styles.cardText, { color: theme.text }]}>Focus session ready for today</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="alarm-outline" size={18} color={theme.primary} />
          <Text style={[styles.cardText, { color: theme.text }]}>Your next study reminder can live here</Text>
        </View>
        <View style={styles.cardRow}>
          <Ionicons name="list-outline" size={18} color={theme.primary} />
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
    marginBottom: Spacing.xs - 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: Typography.title + 2,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  description: {
    fontSize: Typography.body - 1,
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  card: {
    borderRadius: Radius.md,
    gap: Spacing.sm + 2,
    marginTop: Spacing.lg,
    padding: Spacing.md + 2,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  cardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardText: {
    flex: 1,
    fontSize: Typography.body - 1,
    lineHeight: 20,
  },
});
