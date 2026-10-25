import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { ThemeMode } from '@/constants/auth-theme';

type GhostFibersProps = {
  mode: ThemeMode;
};

const DOTS = [
  { left: '12%', top: '20%', size: 8, duration: 6800, delay: 0 },
  { left: '28%', top: '68%', size: 5, duration: 7600, delay: 900 },
  { left: '52%', top: '31%', size: 6, duration: 8200, delay: 1400 },
  { left: '74%', top: '73%', size: 9, duration: 7200, delay: 500 },
  { left: '88%', top: '18%', size: 5, duration: 9000, delay: 1700 },
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
  const fiberColor = isDark ? '#44b0c6' : '#9ed9df';
  const glowColor = isDark ? '#308c98' : '#c7e8e8';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.fiber,
          styles.fiberOne,
          {
            borderColor: fiberColor,
            opacity: isDark ? 0.16 : 0.1,
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
            opacity: isDark ? 0.12 : 0.07,
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
              opacity: isDark ? 0.22 : 0.11,
              top: dot.top,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-12 + dot.delay / 300, 12 - dot.delay / 300] }) }],
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
    borderWidth: 2,
    height: 380,
    position: 'absolute',
    width: '125%',
  },
  fiberOne: {
    left: '-38%',
    top: '8%',
  },
  fiberTwo: {
    left: '-8%',
    top: '38%',
  },
  dot: {
    borderRadius: 999,
    position: 'absolute',
  },
});
