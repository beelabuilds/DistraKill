import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function AppLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAuthTheme();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/welcome');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="focus-session" />
        <Stack.Screen name="islamic-duaa" />
      </Stack>

      <View
        pointerEvents="box-none"
        style={[
          styles.themeButtonContainer,
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

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  themeButtonContainer: {
    elevation: 20,
    position: 'absolute',
    right: 18,
    zIndex: 100,
  },
});