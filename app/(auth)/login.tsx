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

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const theme = useAuthTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
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
      router.replace("/home");
    } catch {
      setErrors({ form: "Unable to sign in right now. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <BackButton fallbackHref="/welcome" />
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: theme.secondary }]}>Welcome back</Text>
          <Text style={[styles.title, { color: theme.text }]}>Sign in to continue</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: theme.textMuted }]}>
        Pick up where you left off and keep your focus tools ready in one place.
      </Text>

      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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

        <Pressable
          accessibilityRole="link"
          hitSlop={12}
          onPress={() => router.push("/forgot-password")}
        >
          <Text style={[styles.linkText, { color: theme.primary }]}>Forgot password?</Text>
        </Pressable>

        {errors.form ? (
          <Text style={[styles.formError, { color: theme.error }]}>{errors.form}</Text>
        ) : null}

        <PrimaryButton label="Login" loading={loading} onPress={handleLogin} />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>New here?</Text>
        <Link href="/register" asChild>
          <Pressable accessibilityRole="link" hitSlop={10}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>Create account</Text>
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
    gap: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.md + 2,
    borderWidth: 1,
  },
  linkText: {
    fontSize: Typography.label,
    fontWeight: "700",
    textAlign: "right",
    paddingVertical: Spacing.xs,
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
