import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function AiAssistantScreen() {
  const theme = useAuthTheme();

  return (
    <ScreenContainer scrollable>
      <View style={[styles.iconBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="sparkles-outline" size={28} color={theme.primary} />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>AI Assistant</Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>
        Your virtual study companion. Get help summarizing complex notes, explaining difficult concepts, or generating practice quizzes in real-time.
      </Text>

      <View style={[styles.placeholderCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Upcoming Features</Text>
        <View style={styles.listItem}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.textMuted }]}>Interactive text-based study chat</Text>
        </View>
        <View style={styles.listItem}>
          <Ionicons name="document-text-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.textMuted }]}>PDF summary & analysis upload tool</Text>
        </View>
        <View style={styles.listItem}>
          <Ionicons name="flash-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.textMuted }]}>Automated smart flashcard generator</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  iconBubble: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: Radius.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
    borderWidth: 1.5,
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
  },
  placeholderCard: {
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginTop: Spacing.xl,
    padding: Spacing.md + 2,
    borderWidth: 1,
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
    fontSize: Typography.body - 1,
    flex: 1,
  },
});
