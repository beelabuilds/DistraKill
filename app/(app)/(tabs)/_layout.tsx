import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function TabLayout() {
  const theme = useAuthTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          // Floating positioning
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 20,
          right: 20,

          // Styling & Shape
          backgroundColor: theme.surface,
          borderRadius: 30,
          height: 58,
          borderTopWidth: 0,

          borderWidth: 1,
          paddingTop: 0,
          paddingBottom: 0,
          borderColor: theme.border,

          elevation: 8,

          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 6,
          },
          shadowOpacity: 0.12,
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 12,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-assistant"
        options={{
          title: 'AI Assistant',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="study-planner"
        options={{
          title: 'Smart Study Planner',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
