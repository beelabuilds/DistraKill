import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';

export function ThemeToggleButton() {
  const {
    mode,
    theme,
    toggleTheme,
  } = useAppTheme();

  const isDarkMode = mode === 'dark';

  return (
    <Pressable
      accessibilityLabel={
        isDarkMode
          ? 'Switch to light mode'
          : 'Switch to dark mode'
      }
      accessibilityRole="button"
      hitSlop={10}
      onPress={toggleTheme}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Ionicons
        name={
          isDarkMode
            ? 'sunny-outline'
            : 'moon-outline'
        }
        size={25}
        color={theme.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    elevation: 5,
    height: 48,
    justifyContent: 'center',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,

    width: 48,
  },
});