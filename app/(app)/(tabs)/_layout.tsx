import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';

export const TAB_BAR_HEIGHT = 48;
export const TAB_BAR_BOTTOM = Platform.OS === 'ios' ? 14 : 10;

export default function TabLayout() {
  const { theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarShowLabel: false,
        tabBarStyle: {
          // Floating positioning - spans across phone width with a modern margin gap on both ends
          position: 'absolute',
          bottom: TAB_BAR_BOTTOM,
          left: 18,
          right: 18,

          // Styling & Shape - sleek, modern rounded floating bar
          backgroundColor: theme.surface,
          borderRadius: 26,
          height: TAB_BAR_HEIGHT,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: theme.border,
          paddingHorizontal: 8,
          paddingTop: 0,
          paddingBottom: 0,

          elevation: 6,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          height: TAB_BAR_HEIGHT,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
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
              size={19}
              color={(color as string) || theme.primary}
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
              size={19}
              color={(color as string) || theme.primary}
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
              size={19}
              color={(color as string) || theme.primary}
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
              size={19}
              color={(color as string) || theme.primary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
