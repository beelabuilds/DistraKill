import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { ThemeMode } from '@/constants/auth-theme';

type GhostFibersProps = {
  mode: ThemeMode;
};

const DOTS = [
  { left: '8%', top: '18%', size: 10, delay: 0 },
  { left: '22%', top: '72%', size: 7, delay: 900 },
  { left: '39%', top: '34%', size: 8, delay: 1400 },
  { left: '58%', top: '78%', size: 11, delay: 500 },
  { left: '76%', top: '24%', size: 7, delay: 1700 },
  { left: '91%', top: '64%', size: 9, delay: 1100 },
];

export default function GhostFibers({ mode }: GhostFibersProps) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: 9000, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: 9000, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [progress]);

  const isDark = mode === 'dark';
  const fiberColor = isDark ? '#44b0c6' : '#268fa3';
  const glowColor = isDark ? '#308c98' : '#53b7c4';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.fiber,
          styles.fiberOne,
          {
            borderColor: fiberColor,
            opacity: isDark ? 0.3 : 0.22,
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-24, 24] }) }, { rotate: '-12deg' }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.fiber,
          styles.fiberTwo,
          {
            borderColor: glowColor,
            opacity: isDark ? 0.22 : 0.16,
            transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [28, -28] }) }, { rotate: '17deg' }],
          },
        ]}
      />
      {DOTS.map((dot) => (
        <Animated.View
          key={`${dot.left}-${dot.top}`}
          style={[
            styles.dot,
            {
              backgroundColor: fiberColor,
              height: dot.size,
              left: dot.left,
              opacity: isDark ? 0.34 : 0.24,
              top: dot.top,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-24 + dot.delay / 160, 24 - dot.delay / 160] }) }],
              width: dot.size,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fiber: {
    borderRadius: 260,
    borderWidth: 3,
    height: 720,
    position: 'absolute',
    width: '170%',
  },
  fiberOne: {
    left: '-48%',
    top: '-8%',
  },
  fiberTwo: {
    left: '-18%',
    top: '28%',
  },
  dot: {
    borderRadius: 999,
    position: 'absolute',
  },
});
