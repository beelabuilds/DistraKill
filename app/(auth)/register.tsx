import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthInput } from "@/components/auth/auth-input";
import { BackButton } from "@/components/auth/back-button";
import { PasswordInput } from "@/components/auth/password-input";
import { PrimaryButton } from "@/components/auth/primary-button";
import { ScreenContainer } from "@/components/auth/screen-container";
import { Radius, Spacing, Typography } from "@/constants/auth-theme";
import { useAuth } from "@/contexts/auth-context";
import { useAuthTheme } from "@/hooks/use-auth-theme";
import { isValidEmail } from "@/utils/auth-validation";

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
  const theme = useAuthTheme();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  const validate = () => {
    const nextErrors: RegisterErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Full name is required.";
    }

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters.";
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!acceptedTerms) {
      nextErrors.terms = "Please accept the terms and privacy notice.";
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
      router.replace("/home");
    } catch {
      setErrors({
        form: "Unable to create the account right now. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <BackButton fallbackHref="/welcome" />
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: theme.secondary }]}>Get started</Text>
          <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: theme.textMuted }]}>
        Build your student workspace in a few steps and keep your login details
        organized.
      </Text>

      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
          style={[
            styles.checkboxRow,
            acceptedTerms ? styles.checkboxRowActive : undefined,
          ]}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: acceptedTerms ? theme.primary : theme.border },
              acceptedTerms ? { backgroundColor: theme.primary } : undefined,
            ]}
          >
            {acceptedTerms ? (
              <Ionicons name="checkmark" size={14} color={theme.buttonText} />
            ) : null}
          </View>
          <Text style={[styles.checkboxText, { color: theme.text }]}>
            I agree to the terms and privacy policy.
          </Text>
        </Pressable>
        {errors.terms ? (
          <Text style={[styles.inlineError, { color: theme.error }]}>{errors.terms}</Text>
        ) : null}
        {errors.form ? (
          <Text style={[styles.formError, { color: theme.error }]}>{errors.form}</Text>
        ) : null}

        <PrimaryButton
          label="Create account"
          loading={loading}
          onPress={handleRegister}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>Already have an account?</Text>
        <Link href="/login" asChild>
          <Pressable accessibilityRole="link" hitSlop={10}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>Login</Text>
          </Pressable>
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  kicker: {
    fontSize: Typography.caption,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: Spacing.xs - 2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: Typography.title + 2,
    fontWeight: "800",
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
    gap: Spacing.sm + 2,
    marginTop: Spacing.lg,
    padding: Spacing.md + 2,
    borderWidth: 1,
  },
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  checkboxRowActive: {
    opacity: 1,
  },
  checkbox: {
    alignItems: "center",
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  checkboxText: {
    flex: 1,
    fontSize: Typography.body - 2,
    lineHeight: 18,
  },
  inlineError: {
    fontSize: Typography.caption,
    lineHeight: 18,
    marginTop: -Spacing.xs,
  },
  formError: {
    fontSize: Typography.body - 1,
    lineHeight: 20,
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md + 4,
  },
  footerText: {
    fontSize: Typography.body - 1,
  },
  footerLink: {
    fontSize: Typography.body - 1,
    fontWeight: "800",
  },
});
