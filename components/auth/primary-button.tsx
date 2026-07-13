import { Link, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

type PrimaryButtonProps = {
  label: string;
  loading?: boolean;
  onPress?: () => void | Promise<void>;
  tone?: 'primary' | 'secondary';
  href?: Href;
};

export function PrimaryButton({ label, loading = false, onPress, tone = 'primary', href }: PrimaryButtonProps) {
  const theme = useAuthTheme();

  const button = (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: tone === 'primary' ? theme.primary : theme.surfaceSoft,
          borderColor: tone === 'primary' ? theme.primary : theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      {loading ? <ActivityIndicator color={tone === 'primary' ? '#FFFFFF' : theme.primary} /> : <Text style={[styles.label, { color: tone === 'primary' ? '#FFFFFF' : theme.text }]}>{label}</Text>}
    </Pressable>
  );

  if (href) {
    return (
      <Link asChild href={href}>
        {button}
      </Link>
    );
  }

  return button;
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: Spacing.lg,
  },
  label: {
    fontSize: Typography.button,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
