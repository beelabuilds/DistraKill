import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthInput } from '@/components/auth/auth-input';
import { PasswordInput } from '@/components/auth/password-input';
import { PrimaryButton } from '@/components/auth/primary-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { isValidEmail } from '@/utils/auth-validation';

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await login(email.trim(), password);
      router.replace('/home');
    } catch {
      setErrors({ form: 'Unable to sign in right now. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>Welcome back</Text>
          <Text style={styles.title}>Sign in to continue</Text>
        </View>
        <View style={styles.iconBubble}>
          <Ionicons name="log-in-outline" size={24} color="#4F46E5" />
        </View>
      </View>

      <Text style={styles.description}>Pick up where you left off and keep your focus tools ready in one place.</Text>

      <View style={styles.formCard}>
        <AuthInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          placeholder="student@school.edu"
          value={email}
          onChangeText={setEmail}
          errorMessage={errors.email}
        />
        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          errorMessage={errors.password}
        />

        <Pressable accessibilityRole="link" hitSlop={12} onPress={() => router.push('/forgot-password')}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

        <PrimaryButton label="Login" loading={loading} onPress={handleLogin} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>New here?</Text>
        <Link href="/register" asChild>
          <Pressable accessibilityRole="link" hitSlop={10}>
            <Text style={styles.footerLink}>Create account</Text>
          </Pressable>
        </Link>
      </View>
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
    backgroundColor: 'rgba(79, 70, 229, 0.12)',
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
  linkText: {
    color: '#4F46E5',
    fontSize: Typography.body,
    fontWeight: '700',
    textAlign: 'right',
  },
  formError: {
    color: '#B42318',
    fontSize: Typography.body,
    lineHeight: 22,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  footerText: {
    color: '#5D6B84',
    fontSize: Typography.body,
  },
  footerLink: {
    color: '#4F46E5',
    fontSize: Typography.body,
    fontWeight: '800',
  },
});
