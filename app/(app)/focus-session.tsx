import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/auth/back-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function FocusSessionScreen() {
  const theme = useAuthTheme();

  const [duration, setDuration] = useState(25); // in minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef<any>(null);

  // Load saved stats
  useEffect(() => {
    const loadSavedStats = async () => {
      try {
        const raw = await AsyncStorage.getItem('@distrakill_focus_stats');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.sessionCount !== undefined) setSessionCount(parsed.sessionCount);
          if (parsed.totalMinutes !== undefined) setFocusMinutes(parsed.totalMinutes);
        }
      } catch (e) {}
    };
    loadSavedStats();
  }, []);

  const recordCompletedSession = async (mins: number) => {
    try {
      const raw = await AsyncStorage.getItem('@distrakill_focus_stats');
      const prev = raw ? JSON.parse(raw) : { totalMinutes: 0, sessionCount: 0 };
      const newTotalMins = (prev.totalMinutes || 0) + mins;
      const newSessions = (prev.sessionCount || 0) + 1;
      const todayStr = new Date().toISOString().split('T')[0];

      const updated = {
        totalMinutes: newTotalMins,
        sessionCount: newSessions,
        lastSessionDate: todayStr,
      };
      await AsyncStorage.setItem('@distrakill_focus_stats', JSON.stringify(updated));
      setSessionCount(newSessions);
      setFocusMinutes(newTotalMins);
    } catch (e) {}
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      recordCompletedSession(duration);
      setTimeLeft(duration * 60); // Reset timer
      Alert.alert('Focus Session Completed! 🎉', 'Great job staying focused. Take a short break!');
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, timeLeft, duration]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration * 60);
  };

  const handleSelectDuration = (mins: number) => {
    setIsActive(false);
    setDuration(mins);
    setTimeLeft(mins * 60);
  };

  const adjustDuration = (minsOffset: number) => {
    setIsActive(false);
    const newMins = Math.max(1, duration + minsOffset);
    setDuration(newMins);
    setTimeLeft(newMins * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? ((duration * 60 - timeLeft) / (duration * 60)) * 100 : 0;

  return (
    <ScreenContainer contentWidthStyle={{ flex: 1 }}>
      <BackButton fallbackHref="/home" />

      <View style={styles.headerRow}>
        <View style={[styles.iconBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="hourglass" size={28} color={theme.primary} />
        </View>
        <View style={styles.headerTitleContainer}>
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

        {/* Dynamic Duration Pickers */}
        <View style={styles.presetsRow}>
          {[15, 25, 45, 60].map((mins) => {
            const isSelected = duration === mins;
            return (
              <Pressable
                key={mins}
                disabled={isActive}
                onPress={() => handleSelectDuration(mins)}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surfaceSoft,
                    borderColor: theme.border,
                    opacity: isActive ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.presetChipText, { color: isSelected ? theme.buttonText : theme.text }]}>
                  {mins}m
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Fine Tune Duration Adjustment */}
        <View style={styles.adjustRow}>
          <Pressable
            disabled={isActive}
            onPress={() => adjustDuration(-5)}
            style={[styles.adjustBtn, { opacity: isActive ? 0.5 : 1 }]}
          >
            <Ionicons name="remove-circle-outline" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.durationLabelText, { color: theme.text }]}>{duration} mins</Text>
          <Pressable
            disabled={isActive}
            onPress={() => adjustDuration(5)}
            style={[styles.adjustBtn, { opacity: isActive ? 0.5 : 1 }]}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.text} />
          </Pressable>
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
            <Text style={[styles.statValue, { color: theme.primary }]}>{focusMinutes}m</Text>
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
  headerTitleContainer: {
    flex: 1,
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
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    //padding: Spacing.md,
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
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    justifyContent: 'center',
    width: '100%',
  },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  presetChipText: {
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  adjustBtn: {
    padding: Spacing.xs,
  },
  durationLabelText: {
    fontSize: Typography.body,
    fontWeight: '800',
  },
  motivationText: {
    fontSize: Typography.body - 2,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md + 4,
    lineHeight: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg + 4,
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
    width: 76,
    height: 76,
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
