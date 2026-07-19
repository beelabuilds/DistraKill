import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useAuthTheme();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  return (
    <ScreenContainer scrollable>
      <View style={[styles.avatarBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.avatarText, { color: theme.primary }]}>
          {(user?.name ?? 'S').slice(0, 1).toUpperCase()}
        </Text>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>{user?.name ?? 'Student User'}</Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>{user?.email ?? 'student@school.edu'}</Text>

      <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Settings & Account</Text>
        
        <View style={styles.listItem}>
          <Ionicons name="notifications-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.textMuted }]}>Manage focus notifications</Text>
        </View>
        
        <View style={styles.listItem}>
          <Ionicons name="lock-closed-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.textMuted }]}>Security settings</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <Pressable 
          style={({ pressed }) => [
            styles.listItem,
            { opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
          <Text style={[styles.listText, { color: theme.error, fontWeight: '700' }]}>Sign Out</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  avatarBubble: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: Radius.pill,
    height: 72,
    justifyContent: 'center',
    width: 72,
    borderWidth: 1.5,
  },
  avatarText: {
    fontSize: Typography.title + 6,
    fontWeight: '800',
  },
  title: {
    fontSize: Typography.title + 2,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.body - 1,
    lineHeight: 22,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  profileCard: {
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginTop: Spacing.xl,
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
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.xs,
  },
});
