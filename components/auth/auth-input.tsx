import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

type AuthInputProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

export const AuthInput = forwardRef<TextInput, AuthInputProps>(function AuthInput(
  { label, errorMessage, style, ...props },
  ref
) {
  const theme = useAuthTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBackground,
            borderColor: errorMessage ? theme.error : theme.border,
            color: theme.text,
          },
          style,
        ]}
        {...props}
      />
      {errorMessage ? <Text style={[styles.error, { color: theme.error }]}>{errorMessage}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.label,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: Typography.body,
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  error: {
    fontSize: Typography.caption,
    lineHeight: 18,
  },
});
