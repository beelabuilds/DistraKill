import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthInput } from '@/components/auth/auth-input';
import { PrimaryButton } from '@/components/auth/primary-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { isValidEmail } from '@/utils/auth-validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
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
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>Need help?</Text>
          <Text style={styles.title}>Reset your password</Text>
        </View>
        <View style={styles.iconBubble}>
          <Ionicons name="key-outline" size={24} color="#6366F1" />
        </View>
      </View>

      <Text style={styles.description}>Enter your email and we will send a reset link to help you get back in quickly.</Text>

      <View style={styles.formCard}>
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
        <Text style={styles.backLink}>Back to Login</Text>
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
    color: '#6366F1',
    fontSize: Typography.caption,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    color: '#16233D',
    fontSize: Typography.title + 4,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  iconBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: Radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  description: {
    color: '#5D6B84',
    fontSize: Typography.body,
    lineHeight: 23,
    marginTop: Spacing.sm,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
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
  backLink: {
    color: '#4F46E5',
    fontSize: Typography.body,
    fontWeight: '800',
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});
