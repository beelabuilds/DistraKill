import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_BOTTOM, TAB_BAR_HEIGHT } from '@/app/(app)/(tabs)/_layout';
import { ScreenContainer } from '@/components/auth/screen-container';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';
import { answerQuestion, detectAssistantIntent } from '@/services/ai-service';
import { sanitizeAssistantText } from '@/services/assistant-text-sanitizer';
import type { GeneralChatHistory } from '@/services/general-ai-service';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; createdAt: Date; source: 'app' | 'general' };

const SUGGESTIONS = ['What should I study today?', 'Show my pending tasks', 'Give me a dua for studying', 'How is my focus progress?'];

function containsArabic(text: string): boolean {
  return /[\u0600-\u06ff]/.test(text);
}

export default function AiAssistantScreen() {
  const theme = useAuthTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const listRef = useRef<ComponentRef<typeof FlatList<ChatMessage>>>(null);
  const messageIdRef = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollToLatest = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const sendMessage = async (value = input) => {
    const text = value.trim();
    if (!text || isLoading) return;
    const intent = detectAssistantIntent(text);
    messageIdRef.current += 1;
    const messageId = messageIdRef.current;
    const assistantId = `${messageId}-assistant`;
    let streamedAssistantText = '';
    setInput('');
    setIsLoading(true);
    let assistantIdForRequest: string | null = null;
    setMessages((current) => [...current, { id: `${messageId}-user`, role: 'user', text, createdAt: new Date(), source: intent === 'general' ? 'general' : 'app' }]);
    scrollToLatest();
    try {
      const generalHistory: GeneralChatHistory = messages
        .filter((message) => message.source === 'general')
        .slice(-6)
        .map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', text: message.text }));
      assistantIdForRequest = assistantId;
      if (intent === 'general') {
        setMessages((current) => [...current, { id: assistantId, role: 'assistant', text: '', createdAt: new Date(), source: 'general' }]);
      }
      const result = await answerQuestion(text, user?.uid, user?.name, generalHistory, intent === 'general'
        ? (chunk) => {
          streamedAssistantText += chunk;
          const cleanText = sanitizeAssistantText(streamedAssistantText);
          setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: cleanText } : message));
        }
        : undefined);
      if (intent === 'general') {
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, text: sanitizeAssistantText(result.text) } : message));
      } else {
        setMessages((current) => [...current, { id: assistantId, role: 'assistant', text: result.text, createdAt: new Date(), source: 'app' }]);
      }
    } catch {
      const errorText = 'I could not read that information right now. Please check your connection and try again.';
      setMessages((current) => assistantIdForRequest
        ? current.map((message) => message.id === assistantIdForRequest ? { ...message, text: errorText } : message)
        : [...current, { id: `${messageId}-error`, role: 'assistant', text: errorText, createdAt: new Date(), source: 'app' }]);
    } finally {
      setIsLoading(false);
      scrollToLatest();
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const arabic = containsArabic(item.text);
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        <View style={[styles.messageBubble, { backgroundColor: isUser ? theme.primary : theme.surface, borderColor: isUser ? theme.primary : theme.border }]}>
          <Text style={[styles.messageText, { color: isUser ? theme.buttonText : theme.text }, arabic && styles.arabicText]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  const listHeader = messages.length === 0 ? (
    <View style={[styles.welcome, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.welcomeTitle, { color: theme.text }]}>What are you working on?</Text>
      <Text style={[styles.welcomeText, { color: theme.textMuted }]}>Hi! I&apos;m your DistraKill study assistant. I can help with your tasks, study plans, focus progress, duas, and study questions.</Text>
      <View style={styles.suggestions}>{SUGGESTIONS.map((suggestion) => <Pressable key={suggestion} accessibilityRole="button" accessibilityLabel={`Ask: ${suggestion}`} onPress={() => void sendMessage(suggestion)} style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}><Text style={[styles.chipText, { color: theme.text }]}>{suggestion}</Text></Pressable>)}</View>
    </View>
  ) : null;

  return (
    <ScreenContainer authenticatedBackground contentStyle={[styles.screen, { paddingBottom: TAB_BAR_HEIGHT + TAB_BAR_BOTTOM + insets.bottom + 8 }]} contentWidthStyle={styles.content} topRight={<ThemeToggleButton />}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <View style={[styles.iconBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}><Ionicons name="sparkles-outline" size={25} color={theme.primary} /></View>
          <View style={styles.headerCopy}><Text style={[styles.title, { color: theme.text }]}>AI Assistant</Text><Text style={[styles.description, { color: theme.textMuted }]}>Your study companion, grounded in your DistraKill data.</Text></View>
        </View>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={listHeader ?? undefined}
          ListFooterComponent={isLoading ? <View style={[styles.typing, { backgroundColor: theme.surface, borderColor: theme.border }]}><ActivityIndicator size="small" color={theme.primary} /><Text style={{ color: theme.textMuted }}>Thinking...</Text></View> : undefined}
          onContentSizeChange={scrollToLatest}
          renderItem={renderMessage}
        />
        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput accessibilityLabel="Ask the study assistant" multiline maxLength={1000} onChangeText={setInput} onSubmitEditing={() => void sendMessage()} placeholder="Ask your study assistant..." placeholderTextColor={theme.textMuted} returnKeyType="send" style={[styles.input, { color: theme.text }]} value={input} />
          <Pressable accessibilityLabel="Send message" accessibilityRole="button" disabled={!input.trim() || isLoading} onPress={() => void sendMessage()} style={[styles.sendButton, { backgroundColor: theme.primary, opacity: !input.trim() || isLoading ? 0.45 : 1 }]}><Ionicons name="arrow-up" size={20} color={theme.buttonText} /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flex: 1 }, flex: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md }, headerCopy: { flex: 1 },
  iconBubble: { alignItems: 'center', borderRadius: Radius.pill, borderWidth: 1.5, height: 52, justifyContent: 'center', width: 52 },
  title: { fontSize: Typography.title, fontWeight: '800' }, description: { fontSize: Typography.caption, lineHeight: 18, marginTop: Spacing.sm },
  messages: { flexGrow: 1, gap: Spacing.sm, paddingBottom: Spacing.md }, welcome: { borderRadius: Radius.md, borderWidth: 1, marginTop: Spacing.lg, padding: Spacing.md },
  welcomeTitle: { fontSize: Typography.body, fontWeight: '800' }, welcomeText: { fontSize: Typography.body - 1, lineHeight: 21, marginTop: Spacing.sm }, suggestions: { gap: Spacing.sm, marginTop: Spacing.md },
  chip: { borderRadius: Radius.pill, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }, chipText: { fontSize: Typography.caption },
  messageRow: { flexDirection: 'row', width: '100%' }, userRow: { justifyContent: 'flex-end' }, assistantRow: { justifyContent: 'flex-start' }, messageBubble: { borderRadius: Radius.md, borderWidth: 1, maxWidth: '80%', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }, messageText: { fontSize: Typography.body - 1, lineHeight: 21 }, arabicText: { textAlign: 'right', writingDirection: 'rtl' },
  typing: { alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.sm }, inputBar: { alignItems: 'flex-end', borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.sm },
  input: { flex: 1, fontSize: Typography.body, maxHeight: 110, minHeight: 42, paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm }, sendButton: { alignItems: 'center', borderRadius: Radius.pill, height: 42, justifyContent: 'center', width: 42 },
});
