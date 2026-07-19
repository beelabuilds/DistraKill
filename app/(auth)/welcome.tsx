import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/auth/primary-button";
import { ScreenContainer } from "@/components/auth/screen-container";
import { Radius, Spacing, Typography } from "@/constants/auth-theme";
import { useAuthTheme } from "@/hooks/use-auth-theme";

export default function WelcomeScreen() {
  const theme = useAuthTheme();

  return (
    <ScreenContainer scrollable>
      <View style={[styles.heroBadge, { backgroundColor: theme.surface }]}>
        <Ionicons name="school-outline" size={16} color={theme.primary} />
        <Text style={[styles.heroBadgeText, { color: theme.primary }]}>
          DistraKill student flow
        </Text>
      </View>

      <View style={styles.heroBlock}>
        <Text style={[styles.title, { color: theme.text }]}>
          Focus with less friction.
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          A calm, student-friendly workspace for logging in, creating an
          account, and getting back to what matters.
        </Text>
      </View>

      <View style={[styles.featureCard, { backgroundColor: theme.surface }]}>
        <View style={styles.featureRow}>
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color={theme.primary}
          />
          <Text style={[styles.featureText, { color: theme.text }]}>
            Quick access to your study flow
          </Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={theme.primary}
          />
          <Text style={[styles.featureText, { color: theme.text }]}>
            Mock authentication ready for integration
          </Text>
        </View>
        <View style={styles.featureRow}>
          <Ionicons name="sunny-outline" size={18} color={theme.primary} />
          <Text style={[styles.featureText, { color: theme.text }]}>
            Clean screens built for all phone sizes
          </Text>
        </View>
      </View>

      <View style={styles.actionGroup}>
        <PrimaryButton label="Login" href="/login" />
        <PrimaryButton
          label="Create account"
          tone="secondary"
          href="/register"
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          Already have an account?
        </Text>
        <Link href="/login" asChild>
          <Pressable accessibilityRole="link" hitSlop={10}>
            <Text style={[styles.footerLink, { color: theme.primary }]}>
              Sign in
            </Text>
          </Pressable>
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroBadge: {
    alignSelf: "flex-start",
    borderRadius: Radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs - 2,
  },
  heroBadgeText: {
    fontSize: Typography.caption,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroBlock: {
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  title: {
    fontSize: Typography.title + 4,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: Typography.body - 1,
    lineHeight: 22,
  },
  featureCard: {
    borderRadius: Radius.md,
    gap: Spacing.sm + 2,
    marginTop: Spacing.lg,
    padding: Spacing.md + 2,
  },
  featureRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: Typography.body - 1,
    lineHeight: 20,
  },
  actionGroup: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  footerText: {
    fontSize: Typography.body - 1,
  },
  footerLink: {
    fontSize: Typography.body - 1,
    fontWeight: "700",
  },
});
