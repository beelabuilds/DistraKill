import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function TabLayout() {
  const theme = useAuthTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.secondary,

          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },

          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="ai-assistant"
          options={{
            title: 'AI Assistant',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'sparkles' : 'sparkles-outline'}
                size={20}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="study-planner"
          options={{
            title: 'Smart Study Planner',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={20}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={20}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

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