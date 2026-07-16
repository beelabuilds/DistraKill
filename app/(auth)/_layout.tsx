import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useAuth } from '@/contexts/auth-context';

export default function AuthLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />

      <View
        style={[
          styles.themeButton,
          {
            top: insets.top + 12,
          },
        ]}
      >
        <ThemeToggleButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  themeButton: {
    elevation: 20,
    position: 'absolute',
    right: 18,
    zIndex: 100,
  },
});