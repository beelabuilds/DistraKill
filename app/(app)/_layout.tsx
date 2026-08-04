import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';

export default function AppLayout() {
  const insets = useSafeAreaInsets();

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

  themeButtonContainer: {
    elevation: 20,
    position: 'absolute',
    right: 18,
    zIndex: 100,
  },
});