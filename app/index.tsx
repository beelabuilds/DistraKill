import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const theme = useAuthTheme();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
