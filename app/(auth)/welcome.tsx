import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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

        {/* ℹ️ Floating Info Button at Bottom Left */}
        <Pressable
          style={({ pressed }) => [
            styles.infoFloatingBtn,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
          onPress={() => setInfoVisible(true)}
          accessibilityLabel="About DistraKill"
        >
          <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
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
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <View style={[styles.iconBadge, { backgroundColor: theme.surfaceSoft }]}>
                      <Ionicons name="sparkles" size={20} color={theme.primary} />
                    </View>
                    <View>
                      <Text style={[styles.modalTitle, { color: theme.text }]}>
                        About Distra<Text style={{ color: theme.primary }}>Kill</Text>
                      </Text>
                      <Text style={[styles.modalBadgeText, { color: theme.textMuted }]}>
                        v1.0 • MAD Project
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => setInfoVisible(false)} hitSlop={10}>
                    <Ionicons name="close-circle" size={24} color={theme.textMuted} />
                  </Pressable>
                </View>

                {/* Purpose Paragraph */}
                <Text style={[styles.modalPurpose, { color: theme.textMuted }]}>
                  DistraKill is your ultimate student productivity companion built to eliminate digital distractions, optimize study flow, and foster consistent learning habits.
                </Text>

                {/* Feature Highlights */}
                <Text style={[styles.sectionHeading, { color: theme.text }]}>Key Features</Text>

                <View style={styles.featureGrid}>
                  <View style={[styles.featureCardItem, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
                    <View style={[styles.featureIconBox, { backgroundColor: theme.primary + "20" }]}>
                      <Ionicons name="shield-checkmark" size={18} color={theme.primary} />
                    </View>
                    <View style={styles.featureTextCol}>
                      <Text style={[styles.featureTitle, { color: theme.text }]}>Focus & App Blocker</Text>
                      <Text style={[styles.featureSub, { color: theme.textMuted }]}>Block distracting apps and run timer-driven flow sessions.</Text>
                    </View>
                  </View>

                  <View style={[styles.featureCardItem, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
                    <View style={[styles.featureIconBox, { backgroundColor: theme.primary + "20" }]}>
                      <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                    </View>
                    <View style={styles.featureTextCol}>
                      <Text style={[styles.featureTitle, { color: theme.text }]}>Smart Study Planner</Text>
                      <Text style={[styles.featureSub, { color: theme.textMuted }]}>Plan tasks, schedule study routines, and manage exam deadlines.</Text>
                    </View>
                  </View>

                  <View style={[styles.featureCardItem, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
                    <View style={[styles.featureIconBox, { backgroundColor: theme.primary + "20" }]}>
                      <Ionicons name="hardware-chip-outline" size={18} color={theme.primary} />
                    </View>
                    <View style={styles.featureTextCol}>
                      <Text style={[styles.featureTitle, { color: theme.text }]}>AI Study Companion</Text>
                      <Text style={[styles.featureSub, { color: theme.textMuted }]}>Get instant AI tutoring, topic explanations, and task breakdowns.</Text>
                    </View>
                  </View>

                  <View style={[styles.featureCardItem, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
                    <View style={[styles.featureIconBox, { backgroundColor: theme.primary + "20" }]}>
                      <Ionicons name="book-outline" size={18} color={theme.primary} />
                    </View>
                    <View style={styles.featureTextCol}>
                      <Text style={[styles.featureTitle, { color: theme.text }]}>Islamic Duaa Companion</Text>
                      <Text style={[styles.featureSub, { color: theme.textMuted }]}>Authentic supplications for study focus, memory, and success.</Text>
                    </View>
                  </View>

                  <View style={[styles.featureCardItem, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
                    <View style={[styles.featureIconBox, { backgroundColor: theme.primary + "20" }]}>
                      <Ionicons name="flame-outline" size={18} color={theme.primary} />
                    </View>
                    <View style={styles.featureTextCol}>
                      <Text style={[styles.featureTitle, { color: theme.text }]}>Streaks & Habit Tracking</Text>
                      <Text style={[styles.featureSub, { color: theme.textMuted }]}>Build daily study habits, maintain streaks, and level up.</Text>
                    </View>
                  </View>
                </View>

                {/* Project Info Footer */}
                <View style={[styles.projectFooter, { borderColor: theme.border }]}>
                  <Ionicons name="school-outline" size={16} color={theme.primary} />
                  <Text style={[styles.projectFooterText, { color: theme.textMuted }]}>
                    Made with ❤️ by Salsabil & Madina
                  </Text>
                </View>
              </ScrollView>

              <Pressable
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: theme.primary },
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() => setInfoVisible(false)}
              >
                <Text style={[styles.closeBtnText, { color: theme.buttonText }]}>Got it</Text>
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalCard: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md + 4,
    gap: Spacing.sm,
  },
  modalScrollContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: Typography.title - 2,
    fontWeight: "800",
  },
  modalBadgeText: {
    fontSize: Typography.caption,
    fontWeight: "600",
    marginTop: 1,
  },
  modalPurpose: {
    fontSize: Typography.body - 2,
    lineHeight: 20,
  },
  sectionHeading: {
    fontSize: Typography.label,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  featureGrid: {
    gap: Spacing.xs + 2,
  },
  featureCardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  featureIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.label,
    fontWeight: "700",
    marginBottom: 2,
  },
  featureSub: {
    fontSize: Typography.caption,
    lineHeight: 16,
  },
  projectFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    marginTop: Spacing.xs,
  },
  projectFooterText: {
    fontSize: Typography.caption,
    fontWeight: "600",
  },
  closeBtn: {
    height: 44,
    borderRadius: Radius.pill,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  closeBtnText: {
    fontSize: Typography.body - 1,
    fontWeight: "700",
  },
});

