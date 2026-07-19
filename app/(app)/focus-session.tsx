import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { BackButton } from '@/components/auth/back-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function FocusSessionScreen() {
  const theme = useAuthTheme();
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setSessionCount((prev) => prev + 1);
      setTimeLeft(25 * 60); // Reset timer
      alert('Focus Session Completed! Take a short break.');
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <ScreenContainer>
      <BackButton fallbackHref="/study-planner" />

      <View style={styles.headerRow}>
        <View style={[styles.iconBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="hourglass" size={28} color={theme.primary} />
        </View>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Focus Session</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Silence distractions and align your mind.
          </Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Beautiful Circular Progress UI representation */}
        <View style={[styles.timerCircle, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.timerText, { color: theme.text }]}>{formatTime(timeLeft)}</Text>
          <Text style={[styles.timerStatus, { color: theme.primary }]}>
            {isActive ? 'FOCUS TIME' : 'PAUSED'}
          </Text>
          {/* Mock Progress Bar */}
          <View style={[styles.progressBarBackground, { backgroundColor: theme.inputBackground }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  backgroundColor: theme.primary, 
                  width: `${progressPercentage}%` 
                }
              ]} 
            />
          </View>
        </View>

        {/* Motivational prompt */}
        <Text style={[styles.motivationText, { color: theme.text }]}>
          {isActive 
            ? '“Concentrate all your thoughts upon the work at hand.”' 
            : 'Ready to deep dive? Start the timer.'}
        </Text>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          <Pressable 
            onPress={resetTimer}
            style={({ pressed }) => [
              styles.controlButton,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Ionicons name="refresh-outline" size={24} color={theme.text} />
          </Pressable>

          <Pressable 
            onPress={toggleTimer}
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Ionicons 
              name={isActive ? "pause" : "play"} 
              size={32} 
              color={theme.buttonText} 
            />
          </Pressable>

          <Pressable 
            onPress={() => setSoundEnabled(!soundEnabled)}
            style={({ pressed }) => [
              styles.controlButton,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }
            ]}
          >
            <Ionicons 
              name={soundEnabled ? "volume-medium-outline" : "volume-mute-outline"} 
              size={24} 
              color={theme.text} 
            />
          </Pressable>
        </View>

        {/* Stats Section */}
        <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{sessionCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Completed Today</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{sessionCount * 25}m</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Focus Minutes</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
    borderWidth: 1.5,
  },
  title: {
    fontSize: Typography.title,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.caption + 1,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.xl * 2,
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  timerText: {
    fontSize: Typography.display + 10,
    fontWeight: '800',
    letterSpacing: -1,
  },
  timerStatus: {
    fontSize: Typography.caption,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: Spacing.xs,
  },
  progressBarBackground: {
    height: 6,
    width: '70%',
    borderRadius: Radius.pill,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  motivationText: {
    fontSize: Typography.body - 1,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xl * 1.5,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    width: '100%',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    padding: Spacing.md + 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.title,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: Typography.caption,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
});
