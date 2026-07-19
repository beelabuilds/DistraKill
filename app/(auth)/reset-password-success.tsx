import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/auth/back-button';
import { PrimaryButton } from '@/components/auth/primary-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

function getEmailFromParams(emailParam: string | string[] | undefined) {
  if (Array.isArray(emailParam)) {
    return emailParam[0] ?? '';
  }

  return emailParam ?? '';
}

export default function ResetPasswordSuccessScreen() {
  const router = useRouter();
  const theme = useAuthTheme();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = getEmailFromParams(params.email);

  return (
    <ScreenContainer scrollable>
      <BackButton fallbackHref="/login" />
      <View style={[styles.iconBubble, { backgroundColor: theme.surface }]}>
        <Ionicons name="mail-open-outline" size={28} color={theme.primary} />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Check your inbox</Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>
        {email ? `We sent reset instructions to ${email}.` : 'We sent reset instructions to your email address.'}
      </Text>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Text style={[styles.cardTitle, { color: theme.text }]}>What happens next</Text>
        <Text style={[styles.cardText, { color: theme.textMuted }]}>Open the link in your email, choose a new password, and then return to sign in.</Text>
      </View>

      <PrimaryButton label="Back to Login" onPress={() => router.replace('/login')} />

      <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.replace('/login')}>
        <Text style={[styles.backLink, { color: theme.primary }]}>Return to login</Text>
      </Pressable>
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
  card: {
    borderRadius: Radius.md,
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    padding: Spacing.md + 2,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
  },
  cardText: {
    fontSize: Typography.body - 1,
    lineHeight: 20,
  },
  backLink: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});
