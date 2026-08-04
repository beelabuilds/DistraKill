import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import TaskInputForm from '@/components/TaskInputForm';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function StudyPlannerScreen() {
  const theme = useAuthTheme();
  const [isFormActive, setIsFormActive] = useState(false);

  return (
    <ScreenContainer scrollable>
      {isFormActive ? (
        <View style={styles.formContainer}>
          <Pressable
            onPress={() => setIsFormActive(false)}
            style={({ pressed }) => [
              styles.backHeaderBtn,
              { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={16} color={theme.text} />
            <Text style={[styles.backHeaderBtnText, { color: theme.text }]}>
              Back to Planner Dashboard
            </Text>
          </Pressable>

          <TaskInputForm
            onCancel={() => setIsFormActive(false)}
            onFormSubmit={(payload: any) => {
              console.log('Generated study plan payload:', payload);
            }}
          />
        </View>
      ) : (
        <>
          <View
            style={[
              styles.iconBubble,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={28}
              color={theme.primary}
            />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Smart Study Planner
          </Text>

          <Text style={[styles.description, { color: theme.textMuted }]}>
            Organize your academic schedules, plan Pomodoro intervals, track active
            streaks, and distribute assignments systematically.
          </Text>

          {/* CTA Create Study Plan Button */}
          <Pressable
            onPress={() => setIsFormActive(true)}
            style={({ pressed }) => [
              styles.createPlanBtn,
              {
                backgroundColor: theme.primary,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="sparkles-outline" size={18} color={theme.buttonText} />
            <Text style={[styles.createPlanBtnText, { color: theme.buttonText }]}>
              Create Custom Study Plan
            </Text>
          </Pressable>


          <View
            style={[
              styles.placeholderCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Planner Overview
            </Text>

            <View style={styles.listItem}>
              <Ionicons
                name="alarm-outline"
                size={18}
                color={theme.primary}
              />

              <Text style={[styles.listText, { color: theme.textMuted }]}>
                Custom study intervals &amp; Pomodoro timer
              </Text>
            </View>

            <View style={styles.listItem}>
              <Ionicons
                name="hourglass-outline"
                size={18}
                color={theme.primary}
              />

              <Text style={[styles.listText, { color: theme.textMuted }]}>
                Streak tracking &amp; motivational milestones
              </Text>
            </View>

            <View style={styles.listItem}>
              <Ionicons
                name="stats-chart-outline"
                size={18}
                color={theme.primary}
              />

              <Text style={[styles.listText, { color: theme.textMuted }]}>
                Daily productivity graphs &amp; analytical reports
              </Text>
            </View>
          </View>
        </>
      )}
      <View style={{ height: 100 }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  iconBubble: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },

  title: {
    fontSize: Typography.title + 4,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },

  description: {
    fontSize: Typography.body - 1,
    lineHeight: 22,
    marginTop: Spacing.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  formContainer: {
    width: '100%',
    gap: Spacing.md,
  },

  backHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },

  backHeaderBtnText: {
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },

  createPlanBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.pill,
    marginVertical: Spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  createPlanBtnText: {
    fontSize: Typography.button,
    fontWeight: '800',
  },

  focusCard: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
  },

  focusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },

  focusIconBackground: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },

  focusContent: {
    flex: 1,
    gap: 2,
  },

  focusTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
  },

  focusDescription: {
    fontSize: Typography.caption + 1,
    lineHeight: 16,
  },

  focusActionButton: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
    height: 44,
    justifyContent: 'center',
  },

  focusActionButtonText: {
    fontSize: Typography.button,
    fontWeight: '700',
  },

  placeholderCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    marginTop: Spacing.md + 4,
    padding: Spacing.md + 2,
  },

  cardTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
  },

  listItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  listText: {
    flex: 1,
    fontSize: Typography.body - 1,
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});