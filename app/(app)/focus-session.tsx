import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  type AppStateStatus,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import { useNavigation } from 'expo-router';

import { BackButton } from '@/components/auth/back-button';
import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import {
  RINGTONE_LIST,
  DEFAULT_RINGTONE_ID,
  getSelectedRingtoneId,
  saveSelectedRingtoneId,
  playRingtone,
  stopRingtone,
} from '@/utils/audio-manager';

type SessionMode = 'focus' | 'short_break' | 'long_break';

interface PresetOption {
  mins: number;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FOCUS_PRESETS: PresetOption[] = [
  { mins: 15, label: 'Sprint', sub: 'Quick review', icon: 'flash-outline' },
  { mins: 25, label: 'Pomodoro', sub: 'Standard cycle', icon: 'flame-outline' },
  { mins: 45, label: 'Deep Study', sub: 'Complex topics', icon: 'book-outline' },
  { mins: 60, label: 'Flow State', sub: 'Full immersion', icon: 'infinite-outline' },
  { mins: 90, label: 'Ultradian', sub: 'Deep peak', icon: 'rocket-outline' },
];

const SHORT_BREAK_PRESETS: PresetOption[] = [
  { mins: 3, label: 'Micro', sub: 'Blink & posture', icon: 'eye-outline' },
  { mins: 5, label: 'Classic', sub: 'Coffee & stretch', icon: 'cafe-outline' },
  { mins: 10, label: 'Hydrate', sub: 'Walk around', icon: 'water-outline' },
];

const LONG_BREAK_PRESETS: PresetOption[] = [
  { mins: 15, label: 'Recharge', sub: 'Brain reset', icon: 'leaf-outline' },
  { mins: 20, label: 'Refresh', sub: 'Snack & walk', icon: 'fitness-outline' },
  { mins: 30, label: 'Meal Break', sub: 'Full rest', icon: 'restaurant-outline' },
];

// Circular SVG dimensions
const CIRCLE_SIZE = 240;
const STROKE_WIDTH = 10;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusSessionScreen() {
  const { theme, mode } = useAppTheme();
  const { user } = useAuth();
  const userId = user?.uid;

  const statsKey = userId ? `@distrakill_focus_stats_${userId}` : '@distrakill_focus_stats';
  const profileKey = userId ? `@distrakill_user_profile_${userId}` : '@distrakill_user_profile';

  // --- Session State ---
  const navigation = useNavigation();
  const [sessionMode, setSessionMode] = useState<SessionMode>('focus');
  const [focusDuration, setFocusDuration] = useState(25); // minutes
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [distractionBreaches, setDistractionBreaches] = useState(0);

  // --- Ringtone State ---
  const [selectedRingtoneId, setSelectedRingtoneId] = useState(DEFAULT_RINGTONE_ID);
  const [isRingtoneModalOpen, setIsRingtoneModalOpen] = useState(false);
  const [previewingRingtoneId, setPreviewingRingtoneId] = useState<string | null>(null);

  // --- Real Stats & Daily Goal ---
  const [sessionCount, setSessionCount] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [dailyGoalHours, setDailyGoalHours] = useState(2);

  // --- Custom Time Picker Modal State ---
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customInputMins, setCustomInputMins] = useState('25');

  const timerRef = useRef<any>(null);
  const durationRef = useRef(focusDuration);
  const sessionModeRef = useRef(sessionMode);

  // Sync refs
  useEffect(() => {
    durationRef.current =
      sessionMode === 'focus'
        ? focusDuration
        : sessionMode === 'short_break'
        ? shortBreakDuration
        : longBreakDuration;
    sessionModeRef.current = sessionMode;
  }, [sessionMode, focusDuration, shortBreakDuration, longBreakDuration]);

  // Current active duration in minutes
  const currentDuration = useMemo(() => {
    if (sessionMode === 'focus') return focusDuration;
    if (sessionMode === 'short_break') return shortBreakDuration;
    return longBreakDuration;
  }, [sessionMode, focusDuration, shortBreakDuration, longBreakDuration]);

  // 🔒 1. Screen Navigation Locker (Prevents back gesture, tab clicks, router changes)
  useEffect(() => {
    if (!isActive) return;

    const nav = navigation as any;
    const unsubscribe = nav.addListener?.('beforeRemove', (e: any) => {
      // Prevent navigation away from the timer
      e.preventDefault();

      Alert.alert(
        'App Locked 🔒',
        'DistraKill is locked in Focus Mode to eliminate distractions. You cannot leave the app or toggle between features until the countdown reaches 00:00!',
        [
          { text: 'Stay Focused', style: 'default' },
          {
            text: 'Emergency Give Up',
            style: 'destructive',
            onPress: () => {
              setIsActive(false);
              setTimeLeft(currentDuration * 60);
              if (e.data?.action) {
                nav.dispatch(e.data.action);
              }
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [isActive, navigation, currentDuration]);

  // 🔒 2. Android Hardware Back Button Locker
  useEffect(() => {
    if (!isActive) return;

    const onBackPress = () => {
      Alert.alert(
        'App Locked 🔒',
        'DistraKill Focus Locker is active. All navigation is frozen until the countdown completes!'
      );
      return true; // Blocks hardware back
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isActive]);

  // 🔒 3. App State & Background Switch Detection Locker (iOS / Android)
  useEffect(() => {
    if (!isActive) return;

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        setDistractionBreaches((prev) => prev + 1);
      } else if (nextState === 'active') {
        Alert.alert(
          '⚠️ Focus Breach Detected!',
          'You left or minimized DistraKill during your focus countdown. Stay in the app to protect your study streak!'
        );
      }
    });

    return () => sub.remove();
  }, [isActive]);

  // 🔒 4. Web Visibility Change & Unload Locker
  useEffect(() => {
    if (!isActive || Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleVisibility = () => {
      if (document.hidden) {
        setDistractionBreaches((prev) => prev + 1);
      } else {
        Alert.alert(
          '⚠️ Tab Switch Detected!',
          'You navigated away from DistraKill. Keep this tab in focus!'
        );
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Focus countdown is active!';
      return 'Focus countdown is active!';
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive]);

  // Active theme color depending on mode
  const modeColor = useMemo(() => {
    if (sessionMode === 'focus') return theme.primary;
    if (sessionMode === 'short_break') return '#10B981'; // Mint Green
    return '#06B6D4'; // Sky Cyan
  }, [sessionMode, theme.primary]);

  // Load selected ringtone preference
  useEffect(() => {
    void getSelectedRingtoneId().then((id) => {
      setSelectedRingtoneId(id);
    });
  }, []);

  const activeRingtoneItem = useMemo(
    () => RINGTONE_LIST.find((r) => r.id === selectedRingtoneId) || RINGTONE_LIST[0],
    [selectedRingtoneId]
  );

  // --- Audio / Haptic Feedback ---
  const triggerSessionChime = useCallback(() => {
    if (!soundEnabled) return;
    void playRingtone(selectedRingtoneId);
  }, [selectedRingtoneId, soundEnabled]);

  const handleTogglePreview = async (ringtoneId: string) => {
    triggerTapHaptic();
    if (previewingRingtoneId === ringtoneId) {
      await stopRingtone();
      setPreviewingRingtoneId(null);
    } else {
      setPreviewingRingtoneId(ringtoneId);
      await playRingtone(ringtoneId, () => {
        setPreviewingRingtoneId(null);
      });
    }
  };

  const handleSelectRingtone = async (ringtoneId: string) => {
    triggerTapHaptic();
    setSelectedRingtoneId(ringtoneId);
    await saveSelectedRingtoneId(ringtoneId);
  };

  const handleCloseRingtoneModal = async () => {
    await stopRingtone();
    setPreviewingRingtoneId(null);
    setIsRingtoneModalOpen(false);
  };

  const triggerTapHaptic = useCallback(() => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
  }, []);

  // --- 1. Load Real Stats & Daily Goal from Storage ---
  useEffect(() => {
    const loadData = async () => {
      try {
        // A. Stats
        const rawStats = await AsyncStorage.getItem(statsKey);
        if (rawStats) {
          const parsed = JSON.parse(rawStats);
          if (typeof parsed.sessionCount === 'number') setSessionCount(parsed.sessionCount);
          if (typeof parsed.totalMinutes === 'number') setFocusMinutes(parsed.totalMinutes);
        }

        // B. Daily Goal from Profile
        const rawProfile = await AsyncStorage.getItem(profileKey);
        if (rawProfile) {
          const parsedProfile = JSON.parse(rawProfile);
          if (typeof parsedProfile.dailyGoalHours === 'number') {
            setDailyGoalHours(parsedProfile.dailyGoalHours);
          }
        }
      } catch (err) {
        console.warn('Error reading focus data:', err);
      }
    };
    void loadData();
  }, [profileKey, statsKey]);

  // --- 2. Record Completed Session ---
  const recordCompletedSession = useCallback(
    async (mins: number) => {
      try {
        const raw = await AsyncStorage.getItem(statsKey);
        const prev = raw ? JSON.parse(raw) : { totalMinutes: 0, sessionCount: 0, todayMinutes: 0 };
        const newTotalMins = (prev.totalMinutes || 0) + mins;
        const newSessions = (prev.sessionCount || 0) + 1;
        const todayStr = new Date().toISOString().split('T')[0];
        const newTodayMins =
          prev.lastSessionDate === todayStr ? (prev.todayMinutes || 0) + mins : mins;

        const updated = {
          totalMinutes: newTotalMins,
          sessionCount: newSessions,
          todayMinutes: newTodayMins,
          lastSessionDate: todayStr,
        };
        await AsyncStorage.setItem(statsKey, JSON.stringify(updated));
        setSessionCount(newSessions);
        setFocusMinutes(newTotalMins);
      } catch (err) {
        console.warn('Error writing focus stats:', err);
      }
    },
    [statsKey]
  );

  // --- Mode Switching Helper ---
  const handleSwitchMode = useCallback(
    (modeVal: SessionMode, defaultMins?: number) => {
      triggerTapHaptic();
      setIsActive(false);
      setSessionMode(modeVal);

      let targetMins = defaultMins;
      if (!targetMins) {
        if (modeVal === 'focus') targetMins = focusDuration;
        else if (modeVal === 'short_break') targetMins = shortBreakDuration;
        else targetMins = longBreakDuration;
      }

      if (modeVal === 'focus') setFocusDuration(targetMins);
      else if (modeVal === 'short_break') setShortBreakDuration(targetMins);
      else setLongBreakDuration(targetMins);

      setTimeLeft(targetMins * 60);
    },
    [triggerTapHaptic, focusDuration, shortBreakDuration, longBreakDuration]
  );

  // --- 3. Timer Engine ---
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsActive(false);

          const finishedMins = durationRef.current;
          const currentMode = sessionModeRef.current;

          triggerSessionChime();

          if (currentMode === 'focus') {
            void recordCompletedSession(finishedMins);
            Alert.alert(
              '🎉 Session Complete • App Unlocked!',
              `Outstanding work! You completed ${finishedMins} minutes of locked deep focus. DistraKill features have now unfrozen! Take a short break!`,
              [
                {
                  text: 'Take 5m Break',
                  onPress: () => {
                    void stopRingtone();
                    handleSwitchMode('short_break', 5);
                  },
                },
                {
                  text: 'Done',
                  style: 'cancel',
                  onPress: () => {
                    void stopRingtone();
                  },
                },
              ]
            );
          } else {
            Alert.alert(
              'Break Finished • App Unlocked ⚡',
              'Your break is complete! Ready to start your next locked deep focus session?',
              [
                {
                  text: 'Start Focus',
                  onPress: () => {
                    void stopRingtone();
                    handleSwitchMode('focus', 25);
                  },
                },
                {
                  text: 'Dismiss',
                  style: 'cancel',
                  onPress: () => {
                    void stopRingtone();
                  },
                },
              ]
            );
          }

          return finishedMins * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [handleSwitchMode, isActive, recordCompletedSession, triggerSessionChime]);

  // --- Controls ---
  const toggleTimer = () => {
    triggerTapHaptic();
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    triggerTapHaptic();
    void stopRingtone();
    if (isActive) {
      Alert.alert(
        'Abandon Locked Session?',
        'DistraKill is currently locked in Focus Mode. Abandoning now will cancel the timer and unfreeze the app, but no focus streak time will be logged.',
        [
          { text: 'Keep Focusing', style: 'cancel' },
          {
            text: 'Emergency Unlock & Exit',
            style: 'destructive',
            onPress: () => {
              setIsActive(false);
              setTimeLeft(currentDuration * 60);
            },
          },
        ]
      );
    } else {
      setTimeLeft(currentDuration * 60);
    }
  };

  const handleSkipOrComplete = () => {
    triggerTapHaptic();
    if (sessionMode === 'focus') {
      Alert.alert(
        'Finish & Unlock Early?',
        'Complete this locked session now and log your elapsed focus time?',
        [
          { text: 'Keep Going', style: 'cancel' },
          {
            text: 'Log & Unlock',
            onPress: () => {
              setIsActive(false);
              const elapsedSecs = currentDuration * 60 - timeLeft;
              const elapsedMins = Math.max(1, Math.round(elapsedSecs / 60));
              void recordCompletedSession(elapsedMins);
              triggerSessionChime();
              setTimeLeft(currentDuration * 60);
            },
          },
        ]
      );
    } else {
      // Break mode skip
      setIsActive(false);
      handleSwitchMode('focus', focusDuration);
    }
  };

  // --- Choosing Time ---
  const handleSelectPresetDuration = (mins: number) => {
    triggerTapHaptic();
    setIsActive(false);
    if (sessionMode === 'focus') setFocusDuration(mins);
    else if (sessionMode === 'short_break') setShortBreakDuration(mins);
    else setLongBreakDuration(mins);
    setTimeLeft(mins * 60);
  };

  // --- Custom Time Modal Handlers ---
  const handleOpenCustomModal = () => {
    triggerTapHaptic();
    setCustomInputMins(currentDuration.toString());
    setIsCustomModalOpen(true);
  };

  const handleApplyCustomDuration = () => {
    const parsed = parseInt(customInputMins.trim(), 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 240) {
      Alert.alert('Invalid Duration', 'Please enter a valid time between 1 and 240 minutes.');
      return;
    }
    triggerTapHaptic();
    handleSelectPresetDuration(parsed);
    setIsCustomModalOpen(false);
  };

  const handleAdjustCustomStep = (delta: number) => {
    triggerTapHaptic();
    const current = parseInt(customInputMins.trim(), 10) || currentDuration;
    const nextVal = Math.min(240, Math.max(1, current + delta));
    setCustomInputMins(nextVal.toString());
  };

  // --- Formatting & Calculations ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = currentDuration * 60;
  const progressPercentage =
    totalSeconds > 0 ? Math.min(100, Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100)) : 0;

  // SVG Circular Dashoffset
  const strokeDashoffset =
    CIRCUMFERENCE - (progressPercentage / 100) * CIRCUMFERENCE;

  // Presets depending on current mode
  const currentPresets =
    sessionMode === 'focus'
      ? FOCUS_PRESETS
      : sessionMode === 'short_break'
      ? SHORT_BREAK_PRESETS
      : LONG_BREAK_PRESETS;

  // Daily Goal Stats
  const dailyGoalMinutes = dailyGoalHours * 60;
  const goalProgressPercent =
    dailyGoalMinutes > 0 ? Math.min(100, Math.round((focusMinutes / dailyGoalMinutes) * 100)) : 0;

  return (
    <ScreenContainer scrollable>
      {/* Top Header Row with Navigation & Sound Toggle */}
      <View style={styles.topBar}>
        {isActive ? (
          <View style={styles.lockedHeaderPill}>
            <Ionicons name="lock-closed" size={13} color="#FFFFFF" />
            <Text style={styles.lockedHeaderPillText}>LOCKED</Text>
          </View>
        ) : (
          <BackButton fallbackHref="/home" />
        )}

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.screenHeaderTitle, { color: theme.text }]}>
            {isActive ? 'DistraKill Locker' : 'Focus Studio'}
          </Text>
          <View style={styles.studioStatusRow}>
            <View
              style={[
                styles.liveStatusDot,
                { backgroundColor: isActive ? '#EF4444' : '#10B981' },
              ]}
            />
            <Text
              style={[
                styles.screenHeaderSub,
                { color: isActive ? '#EF4444' : theme.textMuted },
              ]}
            >
              {isActive ? 'App Frozen' : 'Ready'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightCluster}>
          {/* Ringtone Selection Chip */}
          <Pressable
            hitSlop={8}
            disabled={isActive}
            onPress={() => {
              triggerTapHaptic();
              setIsRingtoneModalOpen(true);
            }}
            style={({ pressed }) => [
              styles.ringtoneBadgeBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
              isActive && { opacity: 0.6 },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="musical-notes" size={13} color={activeRingtoneItem.color} />
            <Text
              numberOfLines={1}
              style={[styles.ringtoneBadgeText, { color: theme.text }]}
            >
              {activeRingtoneItem.name}
            </Text>
            <Ionicons name="chevron-forward" size={11} color={theme.textMuted} />
          </Pressable>

          {/* Sound Toggle Button */}
          <Pressable
            hitSlop={8}
            onPress={() => {
              triggerTapHaptic();
              setSoundEnabled(!soundEnabled);
            }}
            style={({ pressed }) => [
              styles.soundToggleBtn,
              {
                backgroundColor: soundEnabled ? theme.primary + '18' : theme.surfaceSoft,
                borderColor: soundEnabled ? theme.primary : theme.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={soundEnabled ? 'volume-high' : 'volume-mute-outline'}
              size={18}
              color={soundEnabled ? theme.primary : theme.textMuted}
            />
          </Pressable>
        </View>
      </View>

      {/* Segmented Mode Selector: Focus | Short Break | Long Break */}
      <View
        style={[
          styles.segmentedContainer,
          { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
          isActive && styles.segmentedLocked,
        ]}
        pointerEvents={isActive ? 'none' : 'auto'}
      >
        <Pressable
          onPress={() => handleSwitchMode('focus')}
          style={[
            styles.segmentItem,
            sessionMode === 'focus' && [
              styles.segmentItemActive,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ],
          ]}
        >
          <Ionicons
            name="flame"
            size={16}
            color={sessionMode === 'focus' ? theme.primary : theme.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              {
                color: sessionMode === 'focus' ? theme.primary : theme.textMuted,
                fontWeight: sessionMode === 'focus' ? '800' : '600',
              },
            ]}
          >
            Deep Focus
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleSwitchMode('short_break')}
          style={[
            styles.segmentItem,
            sessionMode === 'short_break' && [
              styles.segmentItemActive,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ],
          ]}
        >
          <Ionicons
            name="cafe"
            size={16}
            color={sessionMode === 'short_break' ? '#10B981' : theme.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              {
                color: sessionMode === 'short_break' ? '#10B981' : theme.textMuted,
                fontWeight: sessionMode === 'short_break' ? '800' : '600',
              },
            ]}
          >
            Short Break
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleSwitchMode('long_break')}
          style={[
            styles.segmentItem,
            sessionMode === 'long_break' && [
              styles.segmentItemActive,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ],
          ]}
        >
          <Ionicons
            name="leaf"
            size={16}
            color={sessionMode === 'long_break' ? '#06B6D4' : theme.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              {
                color: sessionMode === 'long_break' ? '#06B6D4' : theme.textMuted,
                fontWeight: sessionMode === 'long_break' ? '800' : '600',
              },
            ]}
          >
            Long Break
          </Text>
        </Pressable>
      </View>

      {/* 🧭 Circular Timer Ring */}
      <View style={styles.timerDialContainer}>
        <View style={styles.svgWrapper}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Background Track Circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={mode === 'dark' ? '#262626' : '#F1F5F9'}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />

            {/* Glowing Accent Ring */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={modeColor}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
          </Svg>

          {/* Central Information Overlay */}
          <View style={styles.timerCenterContent}>
            <View
              style={[
                styles.modeTagPill,
                {
                  backgroundColor: modeColor + '18',
                  borderColor: modeColor + '30',
                },
              ]}
            >
              <Text style={[styles.modeTagText, { color: modeColor }]}>
                {sessionMode === 'focus'
                  ? '🎯 DEEP FOCUS'
                  : sessionMode === 'short_break'
                  ? '☕ SHORT BREAK'
                  : '🌿 RECHARGE'}
              </Text>
            </View>

            <Text
              style={[
                styles.timerDigitsText,
                { color: theme.text },
              ]}
            >
              {formatTime(timeLeft)}
            </Text>

            <Text style={[styles.timerSubText, { color: theme.textMuted }]}>
              {isActive
                ? `Locked • ${Math.ceil(timeLeft / 60)}m left`
                : 'Tap play to begin'}
            </Text>
          </View>
        </View>
      </View>

      {/* ⏱️ Duration Presets when Idle vs App Locker HUD when Active */}
      {isActive ? (
        <View
          style={[
            styles.lockdownCard,
            {
              backgroundColor: theme.surface,
              borderColor: '#EF444460',
            },
          ]}
        >
          <View style={styles.lockdownCardTop}>
            <View style={styles.lockShieldCircle}>
              <Ionicons name="shield-checkmark" size={24} color="#EF4444" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.lockBadgeRow}>
                <View style={styles.lockStatusDot} />
                <Text style={styles.lockBadgeText}>APP LOCKER ENGAGED</Text>
              </View>
              <Text style={[styles.lockdownTitle, { color: theme.text }]}>
                Features &amp; Navigation Frozen
              </Text>
              <Text style={[styles.lockdownSub, { color: theme.textMuted }]}>
                DistraKill is locked on this timer. All app features will unfreeze automatically when the countdown reaches 00:00.
              </Text>
            </View>
          </View>

          {distractionBreaches > 0 ? (
            <View style={styles.breachAlertRow}>
              <Ionicons name="alert-circle" size={15} color="#EF4444" />
              <Text style={styles.breachAlertText}>
                {distractionBreaches} app switch breach{distractionBreaches > 1 ? 'es' : ''} detected! Stay on this screen.
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.focusCommitmentPill,
                { backgroundColor: theme.surfaceSoft },
              ]}
            >
              <Ionicons name="sparkles" size={13} color="#10B981" />
              <Text style={[styles.focusCommitmentText, { color: theme.textMuted }]}>
                Zero distractions detected • Keep going!
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.presetsSection}>
          <View style={styles.presetsHeaderRow}>
            <Text style={[styles.presetsSectionLabel, { color: theme.textMuted }]}>
              {sessionMode === 'focus' ? 'Focus Intervals' : 'Break Length'}
            </Text>

            <Pressable
              hitSlop={8}
              onPress={handleOpenCustomModal}
              style={({ pressed }) => [
                styles.customTimeHeaderBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="options-outline" size={14} color={theme.primary} />
              <Text style={[styles.customTimeHeaderText, { color: theme.primary }]}>
                Custom Time
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsScroll}
          >
            {currentPresets.map((preset) => {
              const isSelected = currentDuration === preset.mins;
              return (
                <Pressable
                  key={preset.mins}
                  onPress={() => handleSelectPresetDuration(preset.mins)}
                  style={({ pressed }) => [
                    styles.presetCard,
                    {
                      backgroundColor: isSelected ? modeColor : theme.surface,
                      borderColor: isSelected ? modeColor : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.presetCardTopRow}>
                    <Ionicons
                      name={preset.icon}
                      size={16}
                      color={isSelected ? '#FFFFFF' : modeColor}
                    />
                    <Text
                      style={[
                        styles.presetCardMinutes,
                        { color: isSelected ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {preset.mins}m
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.presetCardLabel,
                      { color: isSelected ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    {preset.label}
                  </Text>

                  <Text
                    style={[
                      styles.presetCardSub,
                      {
                        color: isSelected ? 'rgba(255, 255, 255, 0.85)' : theme.textMuted,
                      },
                    ]}
                  >
                    {preset.sub}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 🎮 Primary Interactive Controls */}
      <View style={styles.controlsRow}>
        {/* Reset / Abandon */}
        <Pressable
          onPress={resetTimer}
          style={({ pressed }) => [
            styles.secondaryControlBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={isActive ? 'close-outline' : 'refresh-outline'}
            size={22}
            color={isActive ? '#EF4444' : theme.text}
          />
        </Pressable>

        {/* Big Play / Pause Button */}
        <Pressable
          onPress={toggleTimer}
          style={({ pressed }) => [
            styles.primaryPlayBtn,
            {
              backgroundColor: modeColor,
              shadowColor: modeColor,
            },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={isActive ? 'pause' : 'play'}
            size={34}
            color="#FFFFFF"
            style={{ marginLeft: isActive ? 0 : 3 }}
          />
        </Pressable>

        {/* Skip / Complete Early */}
        <Pressable
          onPress={handleSkipOrComplete}
          style={({ pressed }) => [
            styles.secondaryControlBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={sessionMode === 'focus' ? 'checkmark' : 'play-forward-outline'}
            size={22}
            color={theme.text}
          />
        </Pressable>
      </View>

      {/* 📊 Real Focus Dashboard & Daily Goal Progress */}
      <View
        style={[
          styles.dashboardCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.dashboardMetricsRow}>
          <View style={styles.metricItem}>
            <View style={styles.metricIconCircle}>
              <Ionicons name="flame-outline" size={18} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {sessionCount}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
                Sessions Done
              </Text>
            </View>
          </View>

          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

          <View style={styles.metricItem}>
            <View
              style={[
                styles.metricIconCircle,
                { backgroundColor: '#10B98118' },
              ]}
            >
              <Ionicons name="time-outline" size={18} color="#10B981" />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {focusMinutes}m
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
                Total Focus
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Goal Bar */}
        <View style={[styles.goalTrackerBox, { backgroundColor: theme.surfaceSoft }]}>
          <View style={styles.goalTrackerHeader}>
            <View style={styles.goalTrackerTitleRow}>
              <Ionicons name="trophy-outline" size={14} color={theme.primary} />
              <Text style={[styles.goalTrackerTitle, { color: theme.text }]}>
                Daily Goal: {dailyGoalHours}h
              </Text>
            </View>
            <Text style={[styles.goalTrackerPercent, { color: theme.primary }]}>
              {goalProgressPercent}%
            </Text>
          </View>

          <View style={[styles.goalBarTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.goalBarFill,
                {
                  backgroundColor: goalProgressPercent >= 100 ? '#10B981' : theme.primary,
                  width: `${goalProgressPercent}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* ============================================================== */}
      {/* ⏱️ CUSTOM TIME PICKER MODAL */}
      {/* ============================================================== */}
      <Modal
        visible={isCustomModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsCustomModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Custom Duration
                </Text>
                <Text style={[styles.modalSub, { color: theme.textMuted }]}>
                  Set your exact timer length in minutes
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => setIsCustomModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Stepper with Large Digit Readout */}
            <View style={styles.stepperContainer}>
              <Pressable
                onPress={() => handleAdjustCustomStep(-5)}
                style={({ pressed }) => [
                  styles.stepRoundBtn,
                  { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.stepBtnText, { color: theme.text }]}>-5m</Text>
              </Pressable>

              <Pressable
                onPress={() => handleAdjustCustomStep(-1)}
                style={({ pressed }) => [
                  styles.stepRoundBtn,
                  { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="remove" size={20} color={theme.text} />
              </Pressable>

              <View
                style={[
                  styles.customDisplayBox,
                  { backgroundColor: theme.surfaceSoft, borderColor: modeColor },
                ]}
              >
                <TextInput
                  value={customInputMins}
                  onChangeText={setCustomInputMins}
                  keyboardType="number-pad"
                  maxLength={3}
                  style={[styles.customInputDigit, { color: theme.text }]}
                />
                <Text style={[styles.customInputUnit, { color: theme.textMuted }]}>
                  mins
                </Text>
              </View>

              <Pressable
                onPress={() => handleAdjustCustomStep(1)}
                style={({ pressed }) => [
                  styles.stepRoundBtn,
                  { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="add" size={20} color={theme.text} />
              </Pressable>

              <Pressable
                onPress={() => handleAdjustCustomStep(5)}
                style={({ pressed }) => [
                  styles.stepRoundBtn,
                  { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.stepBtnText, { color: theme.text }]}>+5m</Text>
              </Pressable>
            </View>

            {/* Quick Fast Jump Pills */}
            <View style={styles.quickPillsWrap}>
              <Text style={[styles.quickPillsLabel, { color: theme.textMuted }]}>
                Quick Select:
              </Text>
              <View style={styles.quickPillsRow}>
                {[10, 20, 30, 45, 60, 90, 120].map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => {
                      triggerTapHaptic();
                      setCustomInputMins(m.toString());
                    }}
                    style={[
                      styles.quickPillItem,
                      {
                        backgroundColor:
                          customInputMins === m.toString() ? modeColor : theme.surfaceSoft,
                        borderColor:
                          customInputMins === m.toString() ? modeColor : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickPillText,
                        {
                          color:
                            customInputMins === m.toString() ? '#FFFFFF' : theme.text,
                        },
                      ]}
                    >
                      {m}m
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setIsCustomModalOpen(false)}
                style={({ pressed }) => [
                  styles.cancelModalBtn,
                  { borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.cancelModalText, { color: theme.textMuted }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleApplyCustomDuration}
                style={({ pressed }) => [
                  styles.applyModalBtn,
                  { backgroundColor: modeColor },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.applyModalText}>Set Timer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔔 Focus Ringtone Selection Modal */}
      <Modal
        visible={isRingtoneModalOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCloseRingtoneModal}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.ringtoneModalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderIconWrap}>
                <Ionicons name="musical-notes" size={20} color={theme.primary} />
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Focus Ringtones
                  </Text>
                  <Text style={[styles.modalSub, { color: theme.textMuted }]}>
                    Plays when your session finishes (5–7 seconds)
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleCloseRingtoneModal}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.ringtoneModalCloseBtn,
                  { backgroundColor: theme.surfaceSoft },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="close" size={18} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Ringtone List */}
            <ScrollView
              style={styles.ringtoneListScroll}
              showsVerticalScrollIndicator={false}
            >
              {RINGTONE_LIST.map((item) => {
                const isSelected = item.id === selectedRingtoneId;
                const isPlaying = previewingRingtoneId === item.id;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSelectRingtone(item.id)}
                    style={({ pressed }) => [
                      styles.ringtoneItemCard,
                      {
                        backgroundColor: isSelected
                          ? item.color + '12'
                          : theme.surfaceSoft,
                        borderColor: isSelected ? item.color : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.ringtoneIconCircle,
                        { backgroundColor: item.color + '22' },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={item.color}
                      />
                    </View>

                    <View style={styles.ringtoneTextCol}>
                      <View style={styles.ringtoneTitleRow}>
                        <Text
                          style={[
                            styles.ringtoneItemTitle,
                            { color: theme.text },
                            isSelected && { fontWeight: '700' },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <View
                          style={[
                            styles.durationBadge,
                            { backgroundColor: theme.surface },
                          ]}
                        >
                          <Text
                            style={[
                              styles.durationBadgeText,
                              { color: theme.textMuted },
                            ]}
                          >
                            {item.durationText}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.ringtoneItemSubtitle,
                          { color: theme.textMuted },
                        ]}
                      >
                        {item.subtitle}
                      </Text>
                    </View>

                    {/* Preview Button */}
                    <Pressable
                      hitSlop={8}
                      onPress={(e) => {
                        e.stopPropagation();
                        void handleTogglePreview(item.id);
                      }}
                      style={({ pressed }) => [
                        styles.previewBtn,
                        {
                          backgroundColor: isPlaying
                            ? item.color
                            : theme.surface,
                          borderColor: isPlaying ? item.color : theme.border,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name={isPlaying ? 'stop' : 'play'}
                        size={14}
                        color={isPlaying ? '#FFFFFF' : item.color}
                      />
                    </Pressable>

                    {/* Selection Indicator */}
                    <View
                      style={[
                        styles.ringtoneRadio,
                        {
                          borderColor: isSelected ? item.color : theme.border,
                          backgroundColor: isSelected ? item.color : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Sound Toggle Banner */}
            <View
              style={[
                styles.soundToggleBanner,
                { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
              ]}
            >
              <View style={styles.soundBannerLeft}>
                <Ionicons
                  name={soundEnabled ? 'volume-high' : 'volume-mute'}
                  size={18}
                  color={soundEnabled ? theme.primary : theme.textMuted}
                />
                <Text style={[styles.soundBannerText, { color: theme.text }]}>
                  {soundEnabled ? 'Sound is Enabled' : 'Sound is Muted'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  triggerTapHaptic();
                  setSoundEnabled(!soundEnabled);
                }}
                style={[
                  styles.soundBannerToggleBtn,
                  {
                    backgroundColor: soundEnabled
                      ? theme.primary
                      : theme.border,
                  },
                ]}
              >
                <Text style={styles.soundBannerToggleText}>
                  {soundEnabled ? 'Mute' : 'Enable'}
                </Text>
              </Pressable>
            </View>

            {/* Done Action */}
            <Pressable
              onPress={handleCloseRingtoneModal}
              style={({ pressed }) => [
                styles.doneModalBtn,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.doneModalBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  headerTitleWrap: {
    alignItems: 'center',
    gap: 2,
  },
  screenHeaderTitle: {
    fontSize: Typography.title - 2,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  studioStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  screenHeaderSub: {
    fontSize: Typography.caption - 1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soundToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 4,
  },
  lockedHeaderPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.lg,
    gap: 3,
  },
  segmentedLocked: {
    opacity: 0.45,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.pill,
    gap: 5,
  },
  segmentItemActive: {
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: Typography.caption,
  },
  timerDialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  svgWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  modeTagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: 4,
  },
  modeTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  timerDigitsText: {
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  timerSubText: {
    fontSize: Typography.caption,
    fontWeight: '600',
  },
  lockdownCard: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  lockdownCardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  lockShieldCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF444415',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  lockStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.8,
  },
  lockdownTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
  },
  lockdownSub: {
    fontSize: Typography.caption,
    lineHeight: 17,
    marginTop: 2,
  },
  breachAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.sm,
  },
  breachAlertText: {
    color: '#B91C1C',
    fontSize: Typography.caption - 1,
    fontWeight: '700',
    flex: 1,
  },
  focusCommitmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  focusCommitmentText: {
    fontSize: Typography.caption - 1,
    fontWeight: '600',
  },
  presetsSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  presetsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  presetsSectionLabel: {
    fontSize: Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  customTimeHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customTimeHeaderText: {
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  presetsScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  presetCard: {
    width: 108,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: 3,
  },
  presetCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  presetCardMinutes: {
    fontSize: Typography.body,
    fontWeight: '800',
  },
  presetCardLabel: {
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  presetCardSub: {
    fontSize: 9,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginVertical: Spacing.md,
  },
  secondaryControlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPlayBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  dashboardCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dashboardMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6366F118',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: Typography.title - 2,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: Typography.caption - 1,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 36,
    marginHorizontal: Spacing.sm,
  },
  goalTrackerBox: {
    borderRadius: Radius.md,
    padding: 10,
    gap: 6,
  },
  goalTrackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTrackerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  goalTrackerTitle: {
    fontSize: Typography.caption - 1,
    fontWeight: '700',
  },
  goalTrackerPercent: {
    fontSize: Typography.caption - 1,
    fontWeight: '800',
  },
  goalBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md + 4,
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: Typography.body + 2,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: Typography.caption,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: Spacing.xs,
  },
  stepRoundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  customDisplayBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 2,
    minWidth: 100,
    justifyContent: 'center',
    gap: 4,
  },
  customInputDigit: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
    minWidth: 40,
  },
  customInputUnit: {
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  quickPillsWrap: {
    gap: 6,
  },
  quickPillsLabel: {
    fontSize: Typography.caption - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  quickPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickPillItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: {
    fontSize: Typography.body - 1,
    fontWeight: '600',
  },
  applyModalBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyModalText: {
    color: '#FFFFFF',
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  headerRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ringtoneBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: 160,
  },
  ringtoneBadgeText: {
    fontSize: Typography.caption,
    fontWeight: '600',
    flexShrink: 1,
  },
  ringtoneModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalHeaderIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ringtoneModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringtoneListScroll: {
    maxHeight: 330,
  },
  ringtoneItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 10,
  },
  ringtoneIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringtoneTextCol: {
    flex: 1,
  },
  ringtoneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  ringtoneItemTitle: {
    fontSize: Typography.body - 1,
    fontWeight: '600',
  },
  durationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  durationBadgeText: {
    fontSize: Typography.caption - 2,
    fontWeight: '600',
  },
  ringtoneItemSubtitle: {
    fontSize: Typography.caption,
  },
  previewBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringtoneRadio: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundToggleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  soundBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soundBannerText: {
    fontSize: Typography.caption,
    fontWeight: '600',
  },
  soundBannerToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  soundBannerToggleText: {
    color: '#FFFFFF',
    fontSize: Typography.caption,
    fontWeight: '600',
  },
  doneModalBtn: {
    paddingVertical: 12,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneModalBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.body,
    fontWeight: '700',
  },
});
