import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthInput } from '@/components/auth/auth-input';
import { BackButton } from '@/components/auth/back-button';
import { PrimaryButton } from '@/components/auth/primary-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';
import { isValidEmail } from '@/utils/auth-validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useAuthTheme();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await requestPasswordReset(email.trim());
      router.replace({ pathname: '/reset-password-success', params: { email: email.trim() } });
    } catch {
      setError('Unable to send the reset link right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <BackButton fallbackHref="/login" />
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: theme.secondary }]}>Need help?</Text>
          <Text style={[styles.title, { color: theme.text }]}>Reset your password</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: theme.textMuted }]}>Enter your email and we will send a reset link to help you get back in quickly.</Text>

      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AuthInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          placeholder="student@school.edu"
          value={email}
          onChangeText={setEmail}
          errorMessage={error}
        />

        <PrimaryButton label="Send reset link" loading={loading} onPress={handleSend} />
      </View>

      <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.replace('/login')}>
        <Text style={[styles.backLink, { color: theme.primary }]}>Back to Login</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
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
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  description: {
    fontSize: Typography.body - 1,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  formCard: {
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.md + 2,
    borderWidth: 1,
  },
  backLink: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});
