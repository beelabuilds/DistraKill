import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/auth-context';
import {
  AppThemeProvider,
  useAppTheme,
} from '@/contexts/theme-context';

function RootNavigator() {
  const { mode } = useAppTheme();

  return (
    <NavigationThemeProvider
      value={
        mode === 'dark'
          ? DarkTheme
          : DefaultTheme
      }
    >
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />

        <StatusBar
          style={
            mode === 'dark'
              ? 'light'
              : 'dark'
          }
        />
      </AuthProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigator />
    </AppThemeProvider>
  );
}