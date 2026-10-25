import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';
import GhostFibers from './ghost-fibers';

export function AppAnimatedBackground() {
  const { mode } = useAppTheme();

  return (
    <View pointerEvents="none" style={styles.container}>
      <GhostFibers mode={mode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
});
