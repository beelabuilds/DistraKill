import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';
import { answerQuestion } from '@/services/ai-service';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; createdAt: Date };

const SUGGESTIONS = ['What are my pending tasks?', 'Give me a dua for studying', 'Plan a 25-minute study session', 'Explain active recall'];

export default function AiAssistantScreen() {
  const theme = useAuthTheme();
  const { user } = useAuth();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (value = input) => {
    const text = value.trim();
    if (!text || isLoading) return;
    setInput('');
    setIsLoading(true);
    setMessages((current) => [...current, { id: `${Date.now()}-user`, role: 'user', text, createdAt: new Date() }]);
    try {
      const result = await answerQuestion(text, user?.uid);
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', text: result.text, createdAt: new Date() }]);
    } catch {
      setMessages((current) => [...current, { id: `${Date.now()}-error`, role: 'assistant', text: 'I could not read that information right now. Please check your connection and try again.', createdAt: new Date() }]);
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen} topRight={<ThemeToggleButton />}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <View style={[styles.iconBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}><Ionicons name="sparkles-outline" size={25} color={theme.primary} /></View>
          <View style={styles.headerCopy}><Text style={[styles.title, { color: theme.text }]}>AI Assistant</Text><Text style={[styles.description, { color: theme.textMuted }]}>Your study companion, grounded in your DistraKill data.</Text></View>
        </View>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.length === 0 ? <View style={[styles.welcome, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.welcomeTitle, { color: theme.text }]}>What are you working on?</Text>
            <Text style={[styles.welcomeText, { color: theme.textMuted }]}>Hi! I can help with your tasks, study plans, focus sessions, duas, or general questions.</Text>
            <View style={styles.suggestions}>{SUGGESTIONS.map((suggestion) => <Pressable key={suggestion} accessibilityRole="button" accessibilityLabel={`Ask: ${suggestion}`} onPress={() => void sendMessage(suggestion)} style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}><Text style={[styles.chipText, { color: theme.text }]}>{suggestion}</Text></Pressable>)}</View>
          </View> : null}
          {messages.map((message) => <View key={message.id} style={[styles.messageRow, message.role === 'user' ? styles.userRow : styles.assistantRow]}><View style={[styles.messageBubble, { backgroundColor: message.role === 'user' ? theme.primary : theme.surface, borderColor: message.role === 'user' ? theme.primary : theme.border }]}><Text style={{ color: message.role === 'user' ? theme.buttonText : theme.text }}>{message.text}</Text></View></View>)}
          {isLoading ? <View style={[styles.typing, { backgroundColor: theme.surface, borderColor: theme.border }]}><ActivityIndicator size="small" color={theme.primary} /><Text style={{ color: theme.textMuted }}>Checking your study data...</Text></View> : null}
        </ScrollView>
        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput accessibilityLabel="Ask the study assistant" multiline maxLength={1000} onChangeText={setInput} onSubmitEditing={() => void sendMessage()} placeholder="Ask your assistant..." placeholderTextColor={theme.textMuted} returnKeyType="send" style={[styles.input, { color: theme.text }]} value={input} />
          <Pressable accessibilityLabel="Send message" accessibilityRole="button" disabled={!input.trim() || isLoading} onPress={() => void sendMessage()} style={[styles.sendButton, { backgroundColor: theme.primary, opacity: !input.trim() || isLoading ? 0.45 : 1 }]}><Ionicons name="arrow-up" size={20} color={theme.buttonText} /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 72 }, flex: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md }, headerCopy: { flex: 1 },
  iconBubble: { alignItems: 'center', borderRadius: Radius.pill, borderWidth: 1.5, height: 52, justifyContent: 'center', width: 52 },
  title: { fontSize: Typography.title, fontWeight: '800' }, description: { fontSize: Typography.caption, lineHeight: 18, marginTop: Spacing.sm },
  messages: { flexGrow: 1, gap: Spacing.sm, paddingBottom: Spacing.md }, welcome: { borderRadius: Radius.md, borderWidth: 1, marginTop: Spacing.lg, padding: Spacing.md },
  welcomeTitle: { fontSize: Typography.body, fontWeight: '800' }, welcomeText: { fontSize: Typography.body - 1, lineHeight: 21, marginTop: Spacing.sm }, suggestions: { gap: Spacing.sm, marginTop: Spacing.md },
  chip: { borderRadius: Radius.pill, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }, chipText: { fontSize: Typography.caption },
  messageRow: { flexDirection: 'row', width: '100%' }, userRow: { justifyContent: 'flex-end' }, assistantRow: { justifyContent: 'flex-start' }, messageBubble: { borderRadius: Radius.md, borderWidth: 1, maxWidth: '86%', padding: Spacing.md },
  typing: { alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.sm }, inputBar: { alignItems: 'flex-end', borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.sm },
  input: { flex: 1, fontSize: Typography.body, maxHeight: 110, minHeight: 42, paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm }, sendButton: { alignItems: 'center', borderRadius: Radius.pill, height: 42, justifyContent: 'center', width: 42 },
});
