import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { HandDrawnHeader, ScatteredBackground } from "@/components/auth/background";
import { PrimaryButton } from "@/components/auth/primary-button";
import { ScreenContainer } from "@/components/auth/screen-container";
import { Radius, Spacing, Typography } from "@/constants/auth-theme";
import { useAuthTheme } from "@/hooks/use-auth-theme";

export default function WelcomeScreen() {
  const theme = useAuthTheme();
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <ScreenContainer scrollable>

      <View style={styles.container}>
        <ScatteredBackground color={theme.primary} />

        {/* 🚀 Brand & Logo Section */}
        <View style={styles.brandSection}>
          <HandDrawnHeader color={theme.primary} />
          {/* Styled DistraKill Logo */}
          <View style={styles.logoRow}>
            <Text style={[styles.logoText, { color: theme.text }]}>
              Distra<Text style={{ color: theme.primary }}>Kill</Text>
            </Text>
            <View style={[styles.logoDot, { backgroundColor: theme.primary }]} />
          </View>

          {/* Tagline */}
          <Text style={[styles.title, { color: theme.text }]}>
            Focus with less friction.
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Eliminate distractions, track your flow, and keep your study streak alive.
          </Text>
        </View>

        <View style={styles.actionGroup}>
          <PrimaryButton
            label="Login"
            tone="primary"
            icon="person-outline"
            href="/login" />
          <PrimaryButton
            label="Create account"
            tone="secondary"
            icon="person-add-outline"
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

        {/* ℹ️ Floating Info Button at Bottom Right */}
        <Pressable
          style={({ pressed }) => [
            styles.infoFloatingBtn,
            {
              backgroundColor: theme.primary,
              borderColor: theme.primary,
              //shadowColor: theme.text,
            },
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
          onPress={() => setInfoVisible(true)}
          accessibilityLabel="About DistraKill"
        >
          <Ionicons name="information-circle-outline" size={22} color={theme.background} />
        </Pressable>

        {/* 📄 About Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={infoVisible}
          onRequestClose={() => setInfoVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setInfoVisible(false)}
          >
            <Pressable
              style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Ionicons name="sparkles" size={18} color={theme.primary} />
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    About Distra<Text style={{ color: theme.primary }}>Kill</Text>
                  </Text>
                </View>
                <Pressable onPress={() => setInfoVisible(false)} hitSlop={10}>
                  <Ionicons name="close-circle" size={22} color={theme.textMuted} />
                </Pressable>
              </View>

              <Text style={[styles.modalPurpose, { color: theme.textMuted }]}>
                DistraKill is designed specifically for students to minimize screen distractions, build productive study sessions, and track focus habits without cognitive overload.
              </Text>

              <View style={styles.featureList}>
                <View style={styles.featureRow}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.text }]}>Block distracting apps during flow sessions</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="time-outline" size={16} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.text }]}>Log study hours and keep daily streaks active</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: theme.primary },
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() => setInfoVisible(false)}
              >
                <Text style={styles.closeBtnText}>Got it</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

      </View>

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingBottom: 120,
    position: "relative",
  },
  brandSection: {
    alignItems: "flex-start",
    marginTop: Spacing.sm,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.xs,
  },
  logoText: {
    fontSize: Typography.title + 16,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 3,
  },
  title: {
    fontSize: Typography.title + 0.1,
    fontWeight: "600",
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
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    flex: 1,
    fontSize: Typography.body - 1,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    width: "100%",
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
  infoFloatingBtn: {
    position: "absolute",
    bottom: Spacing.md,
    left: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: Radius.md + 4,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalTitle: {
    fontSize: Typography.title,
    fontWeight: "800",
  },
  modalPurpose: {
    fontSize: Typography.body - 1,
    lineHeight: 22,
  },
  featureList: {
    gap: Spacing.xs + 2,
    marginTop: Spacing.xs,
  },
  closeBtn: {
    height: 44,
    borderRadius: Radius.pill,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: Typography.body - 1,
    fontWeight: "700",
  },
});
