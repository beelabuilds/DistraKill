import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';

import { Spacing } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

import { AuthInput } from './auth-input';

type PasswordInputProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

export function PasswordInput({ label, errorMessage, secureTextEntry = true, style, ...props }: PasswordInputProps) {
  const [isHidden, setIsHidden] = useState(true);
  const theme = useAuthTheme();

  return (
    <View style={styles.container}>
      <AuthInput
        label={label}
        errorMessage={errorMessage}
        secureTextEntry={secureTextEntry && isHidden}
        style={[styles.inputPadding, style]}
        {...props}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isHidden ? `Show ${label.toLowerCase()}` : `Hide ${label.toLowerCase()}`}
        hitSlop={12}
        onPress={() => setIsHidden((current) => !current)}
        style={styles.toggleButton}
      >
        <Ionicons name={isHidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputPadding: {
    paddingRight: 56,
  },
  toggleButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.sm,
    top: 31,
    width: 44,
  },
});
