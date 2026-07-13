import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/primary-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';

function getEmailFromParams(emailParam: string | string[] | undefined) {
  if (Array.isArray(emailParam)) {
    return emailParam[0] ?? '';
  }

  return emailParam ?? '';
}

export default function ResetPasswordSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = getEmailFromParams(params.email);

  return (
    <ScreenContainer scrollable>
      <View style={styles.iconBubble}>
        <Ionicons name="mail-open-outline" size={30} color="#14B8A6" />
      </View>

      <Text style={styles.title}>Check your inbox</Text>
      <Text style={styles.description}>
        {email ? `We sent reset instructions to ${email}.` : 'We sent reset instructions to your email address.'}
      </Text>

      <View style={styles.card}
      >
        <Text style={styles.cardTitle}>What happens next</Text>
        <Text style={styles.cardText}>Open the link in your email, choose a new password, and then return to sign in.</Text>
      </View>

      <PrimaryButton label="Back to Login" onPress={() => router.replace('/login')} />

      <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.replace('/login')}>
        <Text style={styles.backLink}>Return to login</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  iconBubble: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    borderRadius: Radius.pill,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  title: {
    color: '#16233D',
    fontSize: Typography.title + 6,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  description: {
    color: '#5D6B84',
    fontSize: Typography.body,
    lineHeight: 24,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    gap: Spacing.xs,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    shadowColor: '#10213A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  cardTitle: {
    color: '#16233D',
    fontSize: Typography.body + 1,
    fontWeight: '800',
  },
  cardText: {
    color: '#5D6B84',
    fontSize: Typography.body,
    lineHeight: 22,
  },
  backLink: {
    color: '#4F46E5',
    fontSize: Typography.body,
    fontWeight: '800',
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});
