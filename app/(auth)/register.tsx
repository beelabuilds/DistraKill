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

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  form?: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  const validate = () => {
    const nextErrors: RegisterErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must contain at least 8 characters.';
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Confirm your password.';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!acceptedTerms) {
      nextErrors.terms = 'Please accept the terms and privacy notice.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await register(name.trim(), email.trim(), password);
      router.replace('/home');
    } catch {
      setErrors({ form: 'Unable to create the account right now. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>Get started</Text>
          <Text style={styles.title}>Create your account</Text>
        </View>
        <View style={styles.iconBubble}>
          <Ionicons name="person-add-outline" size={24} color="#14B8A6" />
        </View>
      </View>

      <Text style={styles.description}>Build your student workspace in a few steps and keep your login details organized.</Text>

      <View style={styles.formCard}>
        <AuthInput
          autoComplete="name"
          label="Full name"
          placeholder="Alex Morgan"
          value={name}
          onChangeText={setName}
          errorMessage={errors.name}
        />
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
          placeholder="Create a strong password"
          value={password}
          onChangeText={setPassword}
          errorMessage={errors.password}
        />
        <PasswordInput
          label="Confirm password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          errorMessage={errors.confirmPassword}
        />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          hitSlop={12}
          onPress={() => setAcceptedTerms((current) => !current)}
          style={[styles.checkboxRow, acceptedTerms ? styles.checkboxRowActive : undefined]}
        >
          <View style={[styles.checkbox, acceptedTerms ? styles.checkboxActive : undefined]}>
            {acceptedTerms ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
          </View>
          <Text style={styles.checkboxText}>I agree to the terms and privacy policy.</Text>
        </Pressable>
        {errors.terms ? <Text style={styles.inlineError}>{errors.terms}</Text> : null}
        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

        <PrimaryButton label="Create account" loading={loading} onPress={handleRegister} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Link href="/login" asChild>
          <Pressable accessibilityRole="link" hitSlop={10}>
            <Text style={styles.footerLink}>Login</Text>
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
    color: '#0F9D9A',
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
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
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
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  checkboxRowActive: {
    opacity: 1,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  checkboxText: {
    color: '#16233D',
    flex: 1,
    fontSize: Typography.body,
    lineHeight: 22,
  },
  inlineError: {
    color: '#B42318',
    fontSize: Typography.caption,
    lineHeight: 18,
    marginTop: -Spacing.xs,
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
