import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/primary-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function WelcomeScreen() {
  const theme = useAuthTheme();

  return (
    <ScreenContainer scrollable>
      <View style={styles.heroBadge}>
        <Ionicons name="school-outline" size={18} color={theme.primary} />
        <Text style={[styles.heroBadgeText, { color: theme.primary }]}>DistraKill student flow</Text>
      </View>

      <View style={styles.heroBlock}>
        <Text style={[styles.title, { color: theme.text }]}>Focus with less friction.</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>A calm, student-friendly workspace for logging in, creating an account, and getting back to what matters.</Text>
      </View>

      <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
        <View style={styles.featureRow}>
          <Ionicons name="checkmark-circle-outline" size={20} color={theme.secondary} />
          <Text style={[styles.featureText, { color: theme.text }]}>Quick access to your study flow</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.secondary} />
          <Text style={[styles.featureText, { color: theme.text }]}>Mock authentication ready for later integration</Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="sunny-outline" size={20} color={theme.secondary} />
          <Text style={[styles.featureText, { color: theme.text }]}>Clean screens built for phones of all sizes</Text>
        </View>
      </View>

      <View style={styles.actionGroup}>
        <PrimaryButton label="Login" href="/login" />
        <PrimaryButton label="Create account" tone="secondary" href="/register" />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>Already have an account?</Text>
        <Link href="/login" asChild>
          <Pressable accessibilityRole="link" hitSlop={10}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  heroBadgeText: {
    fontSize: Typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroBlock: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  title: {
    fontSize: Typography.display,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: Typography.body,
    lineHeight: 24,
  },
  featureCard: {
    borderRadius: Radius.lg,
    gap: Spacing.md,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
  },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: Typography.body,
    lineHeight: 22,
  },
  actionGroup: {
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  footerText: {
    fontSize: Typography.body,
  },
  footerLink: {
    fontSize: Typography.body,
    fontWeight: '700',
  },
});
