import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    updateProfile,
} from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    setDoc,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import { auth, db } from '@/config/firebase';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { getSelectedRingtoneId, RINGTONE_LIST } from '@/utils/audio-manager';
import { getTodayKey } from '@/utils/planner-utils';

const GOAL_OPTIONS = [1, 2, 3, 4, 5]; // hours

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, mode, toggleTheme } = useAppTheme();
  const { logout, user } = useAuth();
  const userId = user?.uid;

  const userProfileKey = userId
    ? `@distrakill_user_profile_${userId}`
    : '@distrakill_user_profile';
  const focusStatsKey = userId
    ? `@distrakill_focus_stats_${userId}`
    : '@distrakill_focus_stats';
  const settingsKey = userId
    ? `@distrakill_settings_${userId}`
    : '@distrakill_settings';

  // --- Profile Identity State ---
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [name, setName] = useState(user?.name || 'Student');
  const [username, setUsername] = useState(
    user?.email ? user.email.split('@')[0] : 'student'
  );
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(
    'Dedicated student focusing on daily study habits and deep work.'
  );
  const [major, setMajor] = useState('Computer Science');
  const [dailyGoalHours, setDailyGoalHours] = useState(2); // In hours

  // --- Photo Picker Modal State ---
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // --- Real Dynamic Focus Stats State ---
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);

  // --- Preferences State ---
  const [studyReminders, setStudyReminders] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [ringtoneName, setRingtoneName] = useState('Marimba Melody');

  // --- Edit Profile Modal State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editMajor, setEditMajor] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- Change Password Modal State ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // --- 1. Load Profile, Stats, and Settings from Storage ---
  const loadProfileData = useCallback(async () => {
    try {
      // A. Profile data
      const savedProfile = await AsyncStorage.getItem(userProfileKey);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.avatarUri !== undefined) setAvatarUri(parsed.avatarUri);
        if (parsed.name) setName(parsed.name);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.bio !== undefined) setBio(parsed.bio);
        if (parsed.major !== undefined) setMajor(parsed.major);
        if (typeof parsed.dailyGoalHours === 'number')
          setDailyGoalHours(parsed.dailyGoalHours);
      }

      // B. Focus stats
      const rawFocus = await AsyncStorage.getItem(focusStatsKey);
      if (rawFocus) {
        const parsedFocus = JSON.parse(rawFocus);
        const totalMins = typeof parsedFocus.totalMinutes === 'number' ? parsedFocus.totalMinutes : 0;
        const sessions = typeof parsedFocus.sessionCount === 'number' ? parsedFocus.sessionCount : 0;
        setTotalFocusMinutes(totalMins);
        setTotalSessions(sessions);

        // Check if last session was today
        const todayStr = getTodayKey();
        if (parsedFocus.lastSessionDate === todayStr && typeof parsedFocus.todayMinutes === 'number') {
          setTodayFocusMinutes(parsedFocus.todayMinutes);
        } else if (parsedFocus.lastSessionDate === todayStr) {
          // If todayMinutes isn't explicitly tracked, fallback to total or session time
          setTodayFocusMinutes(Math.min(totalMins, 25 * sessions));
        } else {
          setTodayFocusMinutes(0);
        }
      }

      // C. Settings
      const rawSettings = await AsyncStorage.getItem(settingsKey);
      if (rawSettings) {
        const parsedSettings = JSON.parse(rawSettings);
        if (typeof parsedSettings.studyReminders === 'boolean')
          setStudyReminders(parsedSettings.studyReminders);
        if (typeof parsedSettings.soundEffects === 'boolean')
          setSoundEffects(parsedSettings.soundEffects);
      }

      // Load active focus ringtone
      const rId = await getSelectedRingtoneId();
      const rItem = RINGTONE_LIST.find((r) => r.id === rId);
      if (rItem) setRingtoneName(rItem.name);
    } catch (err) {
      console.warn('Error reading local profile data:', err);
    }

    if (user?.email) setEmail(user.email);

    // D. Cloud Firestore sync
    if (userId) {
      try {
        const profileDocRef = doc(db, 'users', userId, 'profile', 'info');
        const snap = await getDoc(profileDocRef);
        if (snap.exists()) {
          const cloud = snap.data();
          if (cloud.avatarUri !== undefined) setAvatarUri(cloud.avatarUri);
          if (cloud.name) setName(cloud.name);
          if (cloud.username) setUsername(cloud.username);
          if (cloud.bio !== undefined) setBio(cloud.bio);
          if (cloud.major !== undefined) setMajor(cloud.major);
          if (typeof cloud.dailyGoalHours === 'number')
            setDailyGoalHours(cloud.dailyGoalHours);
        }
      } catch (err) {
        console.warn('Firestore profile sync error:', err);
      }
    }
  }, [focusStatsKey, settingsKey, user?.email, userId, userProfileKey]);

  useEffect(() => {
    void loadProfileData();
  }, [loadProfileData]);

  // --- 2. Live completed tasks count from Firestore ---
  useEffect(() => {
    if (!userId) return;
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        let count = 0;
        snapshot.forEach((d) => {
          if (d.data().completed) count += 1;
        });
        setCompletedTasksCount(count);
      },
      (err) => {
        console.warn('Error listening to tasks count:', err);
      }
    );
    return unsubscribe;
  }, [userId]);

  // --- 3. Save Profile Helper ---
  const saveProfile = async (updates: {
    avatarUri?: string | null;
    name?: string;
    username?: string;
    bio?: string;
    major?: string;
    dailyGoalHours?: number;
  }) => {
    const updated = {
      avatarUri: updates.avatarUri !== undefined ? updates.avatarUri : avatarUri,
      name: updates.name ?? name,
      username: updates.username ?? username,
      bio: updates.bio ?? bio,
      major: updates.major ?? major,
      dailyGoalHours:
        updates.dailyGoalHours !== undefined ? updates.dailyGoalHours : dailyGoalHours,
    };

    if (updates.avatarUri !== undefined) setAvatarUri(updates.avatarUri);
    if (updates.name) setName(updates.name);
    if (updates.username) setUsername(updates.username);
    if (updates.bio !== undefined) setBio(updates.bio);
    if (updates.major !== undefined) setMajor(updates.major);
    if (updates.dailyGoalHours !== undefined)
      setDailyGoalHours(updates.dailyGoalHours);

    await AsyncStorage.setItem(userProfileKey, JSON.stringify(updated));

    if (userId) {
      try {
        const profileDocRef = doc(db, 'users', userId, 'profile', 'info');
        await setDoc(profileDocRef, updated, { merge: true });

        if (auth.currentUser && updates.name) {
          await updateProfile(auth.currentUser, { displayName: updates.name });
        }
      } catch (err) {
        console.warn('Cloud profile sync error:', err);
      }
    }
  };

  // --- 4. Photo Picker Handlers (Direct from Device) ---
  const handlePickFromGallery = async () => {
    setIsPhotoModalOpen(false);

    // Desktop Web browser file picker fallback
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            await saveProfile({ avatarUri: dataUrl });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    // Native Mobile
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery access is needed to select a photo from your device.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await saveProfile({ avatarUri: result.assets[0].uri });
      }
    } catch (err) {
      console.error('Gallery picker error:', err);
      Alert.alert('Error', 'Could not open image library.');
    }
  };

  const handleTakePhoto = async () => {
    setIsPhotoModalOpen(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await saveProfile({ avatarUri: result.assets[0].uri });
      }
    } catch (err) {
      console.error('Camera error:', err);
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  const handleRemovePhoto = async () => {
    setIsPhotoModalOpen(false);
    await saveProfile({ avatarUri: null });
  };

  const handleOpenPhotoOptions = () => {
    setIsPhotoModalOpen(true);
  };

  // --- 5. Save Edit Profile Form ---
  const handleOpenEditModal = () => {
    setEditName(name);
    setEditUsername(username);
    setEditBio(bio);
    setEditMajor(major);
    setIsEditModalOpen(true);
  };

  const handleSaveEditProfile = async () => {
    const cleanName = editName.trim() || name;
    const cleanUsername = editUsername.trim().replace(/^@/, '') || username;

    try {
      setIsSavingProfile(true);
      await saveProfile({
        name: cleanName,
        username: cleanUsername,
        bio: editBio.trim(),
        major: editMajor.trim(),
      });
      setIsEditModalOpen(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      console.error('Failed to save profile:', err);
      Alert.alert('Error', 'Could not save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- 6. Quick Daily Focus Goal Picker ---
  const handleSelectGoal = async (hours: number) => {
    await saveProfile({ dailyGoalHours: hours });
  };

  // --- 7. Save Preferences ---
  const handleToggleReminders = async (val: boolean) => {
    setStudyReminders(val);
    await AsyncStorage.setItem(
      settingsKey,
      JSON.stringify({ studyReminders: val, soundEffects })
    );
  };

  const handleToggleSound = async (val: boolean) => {
    setSoundEffects(val);
    await AsyncStorage.setItem(
      settingsKey,
      JSON.stringify({ studyReminders, soundEffects: val })
    );
  };

  // --- 8. Password Change Handler ---
  const handleSavePassword = async () => {
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (!auth.currentUser || !auth.currentUser.email) {
      setPasswordError('Authentication error. Please log in again.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordModalOpen(false);
      Alert.alert('Password Updated 🔐', 'Your password was successfully changed.');
    } catch (err: any) {
      console.error('Password change error:', err);
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setPasswordError('Current password is incorrect. Please try again.');
      } else if (err.code === 'auth/requires-recent-login') {
        setPasswordError(
          'For security, please log out and sign in again before changing password.'
        );
      } else {
        setPasswordError(err.message || 'Failed to update password.');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // --- 9. Sign Out ---
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of DistraKill?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/welcome' as never);
        },
      },
    ]);
  };

  // Calculated Real Values (No Hardcoded Values)
  const focusTimeDisplay = useMemo(() => {
    if (totalFocusMinutes <= 0) return '0m';
    const hrs = Math.floor(totalFocusMinutes / 60);
    const mins = totalFocusMinutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  }, [totalFocusMinutes]);

  const dailyGoalMinutes = dailyGoalHours * 60;
  const goalProgressPercent =
    dailyGoalMinutes > 0
      ? Math.min(100, Math.round((todayFocusMinutes / dailyGoalMinutes) * 100))
      : 0;

  return (
    <ScreenContainer authenticatedBackground scrollable contentStyle={{ paddingBottom: 110 }}>
      {/* 👤 Profile Hero Card */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Pressable
          onPress={handleOpenPhotoOptions}
          style={({ pressed }) => [
            styles.avatarPressable,
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.primary,
              },
            ]}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarInitialText, { color: theme.primary }]}>
                {(name || 'S').slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.cameraBadge,
              { backgroundColor: theme.primary, borderColor: theme.surface },
            ]}
          >
            <Ionicons name="camera" size={13} color="#FFFFFF" />
          </View>
        </Pressable>

        <View style={styles.identityCol}>
          <Text style={[styles.nameText, { color: theme.text }]}>{name}</Text>
          <Text style={[styles.usernameText, { color: theme.primary }]}>
            @{username}
          </Text>

          {major ? (
            <View style={styles.majorRow}>
              <Ionicons name="school-outline" size={13} color={theme.textMuted} />
              <Text style={[styles.majorText, { color: theme.textMuted }]}>
                {major}
              </Text>
            </View>
          ) : null}

          {bio ? (
            <Text style={[styles.bioText, { color: theme.textMuted }]}>
              {bio}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={handleOpenEditModal}
          style={({ pressed }) => [
            styles.editProfileBtn,
            { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="pencil-outline" size={14} color={theme.primary} />
          <Text style={[styles.editProfileBtnText, { color: theme.text }]}>
            Edit Profile
          </Text>
        </Pressable>
      </View>

      {/* 📊 Dynamic Real Focus Stats Bar */}
      <View
        style={[
          styles.statsCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {focusTimeDisplay}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            Total Focus
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {completedTasksCount}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            Tasks Done
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {totalSessions}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>
            Sessions
          </Text>
        </View>
      </View>

      {/* 🎯 Daily Focus Goal Section */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.sectionCardHeader}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Daily Focus Goal
            </Text>
            <Text style={[styles.cardSub, { color: theme.textMuted }]}>
              {todayFocusMinutes}m completed today of {dailyGoalMinutes}m target
            </Text>
          </View>

          <View
            style={[
              styles.goalPill,
              { backgroundColor: theme.primary + '18' },
            ]}
          >
            <Text style={[styles.goalPillText, { color: theme.primary }]}>
              {dailyGoalHours}h Goal
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarWrapper}>
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: theme.surfaceSoft },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor:
                    goalProgressPercent >= 100 ? '#10B981' : theme.primary,
                  width: `${goalProgressPercent}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressHint, { color: theme.textMuted }]}>
            {goalProgressPercent >= 100
              ? '🎉 Daily focus goal achieved!'
              : `${goalProgressPercent}% achieved today`}
          </Text>
        </View>

        {/* Quick Goal Selector */}
        <View style={styles.goalOptionsRow}>
          <Text style={[styles.goalOptionLabel, { color: theme.textMuted }]}>
            Set target:
          </Text>
          {GOAL_OPTIONS.map((h) => {
            const isSelected = dailyGoalHours === h;
            return (
              <Pressable
                key={h}
                onPress={() => handleSelectGoal(h)}
                style={[
                  styles.goalChip,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.surfaceSoft,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.goalChipText,
                    {
                      color: isSelected ? theme.buttonText : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {h}h
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>



      {/* ⚙️ Theme, Notifications & Settings */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Preferences &amp; Theme
        </Text>

        {/* Theme Mode Toggle (Real context toggle) */}
        <View style={styles.settingRow}>
          <View style={styles.settingIconBg}>
            <Ionicons
              name={mode === 'dark' ? 'moon' : 'sunny'}
              size={18}
              color={theme.primary}
            />
          </View>
          <View style={styles.settingTextCol}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Theme Appearance
            </Text>
            <Text style={[styles.settingSub, { color: theme.textMuted }]}>
              Currently in {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Study Reminders */}
        <View style={styles.settingRow}>
          <View style={styles.settingIconBg}>
            <Ionicons
              name="notifications-outline"
              size={18}
              color={theme.primary}
            />
          </View>
          <View style={styles.settingTextCol}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Study Reminders
            </Text>
            <Text style={[styles.settingSub, { color: theme.textMuted }]}>
              Alerts for scheduled tasks
            </Text>
          </View>
          <Switch
            value={studyReminders}
            onValueChange={handleToggleReminders}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Sound Effects */}
        <View style={styles.settingRow}>
          <View style={styles.settingIconBg}>
            <Ionicons
              name="volume-high-outline"
              size={18}
              color={theme.primary}
            />
          </View>
          <View style={styles.settingTextCol}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Focus Sounds
            </Text>
            <Text style={[styles.settingSub, { color: theme.textMuted }]}>
              Timer completion chimes
            </Text>
          </View>
          <Switch
            value={soundEffects}
            onValueChange={handleToggleSound}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>

        {/* Focus Ringtone */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable
          onPress={() => router.push('/(app)/focus-session' as any)}
          style={({ pressed }) => [
            styles.settingRow,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={styles.settingIconBg}>
            <Ionicons
              name="musical-notes-outline"
              size={18}
              color={theme.primary}
            />
          </View>
          <View style={styles.settingTextCol}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Focus Ringtone
            </Text>
            <Text style={[styles.settingSub, { color: theme.textMuted }]}>
              {ringtoneName} • 5–7s Chime
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.textMuted}
          />
        </Pressable>
      </View>

      {/* 🔐 Account Actions Card */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Account Actions
        </Text>

        {/* Email Address */}
        <View style={styles.settingRow}>
          <View style={styles.settingIconBg}>
            <Ionicons name="mail-outline" size={18} color={theme.primary} />
          </View>
          <View style={styles.settingTextCol}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Registered Email
            </Text>
            <Text style={[styles.settingSub, { color: theme.textMuted }]}>
              {email}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Change Password */}
        <Pressable
          onPress={() => {
            setPasswordError('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setIsPasswordModalOpen(true);
          }}
          style={({ pressed }) => [
            styles.settingRow,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.settingIconBg}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={theme.primary}
            />
          </View>
          <View style={styles.settingTextCol}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Change Password
            </Text>
            <Text style={[styles.settingSub, { color: theme.textMuted }]}>
              Update your account password
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textMuted}
          />
        </Pressable>
      </View>

      {/* 🚪 Sign Out */}
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [
          styles.signOutCard,
          { backgroundColor: theme.surface, borderColor: '#FEE2E2' },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      {/* ============================================================== */}
      {/* ✏️ EDIT PROFILE MODAL */}
      {/* ============================================================== */}
      <Modal
        visible={isEditModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalOpen(false)}
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
                  Edit Profile
                </Text>
                <Text style={[styles.modalSub, { color: theme.textMuted }]}>
                  Update your public student card
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => setIsEditModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              {/* Photo Row */}
              <View
                style={[
                  styles.photoRow,
                  {
                    backgroundColor: theme.surfaceSoft,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.miniAvatarCircle,
                    {
                      borderColor: theme.primary,
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '800',
                        color: theme.primary,
                      }}
                    >
                      {(editName || 'S').slice(0, 1).toUpperCase()}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.photoRowTitle, { color: theme.text }]}>
                    Profile Photo
                  </Text>
                  <Text style={[styles.photoRowSub, { color: theme.textMuted }]}>
                    {avatarUri ? 'Selected from device' : 'Default initials avatar'}
                  </Text>
                </View>

                <Pressable
                  onPress={handleOpenPhotoOptions}
                  style={[
                    styles.changePhotoPill,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.changePhotoPillText}>Change</Text>
                </Pressable>
              </View>

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                  Display Name *
                </Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your full name"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
              </View>

              {/* Username Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                  Username *
                </Text>
                <View
                  style={[
                    styles.inputWithPrefix,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.prefixAt, { color: theme.primary }]}>
                    @
                  </Text>
                  <TextInput
                    value={editUsername}
                    onChangeText={setEditUsername}
                    placeholder="username"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
                    style={[styles.bareInput, { color: theme.text }]}
                  />
                </View>
              </View>

              {/* Major / Field of study */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                  Major / Field of Study
                </Text>
                <TextInput
                  value={editMajor}
                  onChangeText={setEditMajor}
                  placeholder="e.g. Computer Science"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
              </View>

              {/* Bio & Motto */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                    Bio &amp; Study Motto
                  </Text>
                  <Text
                    style={[styles.charCountText, { color: theme.textMuted }]}
                  >
                    {editBio.length}/150
                  </Text>
                </View>
                <TextInput
                  value={editBio}
                  onChangeText={(t) => {
                    if (t.length <= 150) setEditBio(t);
                  }}
                  multiline
                  numberOfLines={3}
                  placeholder="A short intro or study motto..."
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setIsEditModalOpen(false)}
                style={({ pressed }) => [
                  styles.cancelActionBtn,
                  { borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.cancelActionText, { color: theme.textMuted }]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={isSavingProfile}
                onPress={handleSaveEditProfile}
                style={({ pressed }) => [
                  styles.saveActionBtn,
                  { backgroundColor: theme.primary },
                  (pressed || isSavingProfile) && styles.pressed,
                ]}
              >
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveActionText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 🔐 CHANGE PASSWORD MODAL */}
      {/* ============================================================== */}
      <Modal
        visible={isPasswordModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsPasswordModalOpen(false)}
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
                  Change Password
                </Text>
                <Text style={[styles.modalSub, { color: theme.textMuted }]}>
                  Keep your account secure
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => setIsPasswordModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBody}
            >
              {passwordError ? (
                <View style={styles.passwordErrorBox}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.passwordErrorText}>{passwordError}</Text>
                </View>
              ) : null}

              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                  Current Password *
                </Text>
                <View
                  style={[
                    styles.inputWithIconRow,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.bareInput, { color: theme.text }]}
                  />
                  <Pressable
                    hitSlop={8}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Ionicons
                      name={showCurrentPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color={theme.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                  New Password (min 8 characters) *
                </Text>
                <View
                  style={[
                    styles.inputWithIconRow,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.bareInput, { color: theme.text }]}
                  />
                  <Pressable
                    hitSlop={8}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color={theme.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>
                  Confirm New Password *
                </Text>
                <View
                  style={[
                    styles.inputWithIconRow,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showNewPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.bareInput, { color: theme.text }]}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setIsPasswordModalOpen(false)}
                style={({ pressed }) => [
                  styles.cancelActionBtn,
                  { borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.cancelActionText, { color: theme.textMuted }]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                disabled={isUpdatingPassword}
                onPress={handleSavePassword}
                style={({ pressed }) => [
                  styles.saveActionBtn,
                  { backgroundColor: theme.primary },
                  (pressed || isUpdatingPassword) && styles.pressed,
                ]}
              >
                {isUpdatingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveActionText}>Update Password</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 📷 SELECT PHOTO FROM DEVICE MODAL */}
      {/* ============================================================== */}
      <Modal
        visible={isPhotoModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsPhotoModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.photoPickerModalSheet,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Profile Picture
                </Text>
                <Text style={[styles.modalSub, { color: theme.textMuted }]}>
                  Select an image from your device
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => setIsPhotoModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={styles.photoOptionsList}>
              {/* Option 1: Device Photo Library / File picker */}
              <Pressable
                onPress={handlePickFromGallery}
                style={({ pressed }) => [
                  styles.photoOptionBtn,
                  { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.photoOptionIconCircle,
                    { backgroundColor: theme.primary + '18' },
                  ]}
                >
                  <Ionicons name="images-outline" size={20} color={theme.primary} />
                </View>
                <View style={styles.photoOptionTextCol}>
                  <Text style={[styles.photoOptionTitle, { color: theme.text }]}>
                    Choose from Library
                  </Text>
                  <Text style={[styles.photoOptionSub, { color: theme.textMuted }]}>
                    Pick a photo saved on this device
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </Pressable>

              {/* Option 2: Camera */}
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [
                  styles.photoOptionBtn,
                  { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.photoOptionIconCircle,
                    { backgroundColor: theme.primary + '18' },
                  ]}
                >
                  <Ionicons name="camera-outline" size={20} color={theme.primary} />
                </View>
                <View style={styles.photoOptionTextCol}>
                  <Text style={[styles.photoOptionTitle, { color: theme.text }]}>
                    Take Photo
                  </Text>
                  <Text style={[styles.photoOptionSub, { color: theme.textMuted }]}>
                    Capture a new picture with camera
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </Pressable>

              {/* Option 3: Remove Current Picture (if set) */}
              {avatarUri ? (
                <Pressable
                  onPress={handleRemovePhoto}
                  style={({ pressed }) => [
                    styles.photoOptionBtn,
                    { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.photoOptionIconCircle,
                      { backgroundColor: '#FCA5A5' },
                    ]}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </View>
                  <View style={styles.photoOptionTextCol}>
                    <Text style={[styles.photoOptionTitle, { color: '#EF4444' }]}>
                      Remove Photo
                    </Text>
                    <Text style={[styles.photoOptionSub, { color: '#B91C1C' }]}>
                      Reset to default avatar initials
                    </Text>
                  </View>
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={() => setIsPhotoModalOpen(false)}
              style={({ pressed }) => [
                styles.cancelActionBtn,
                { borderColor: theme.border, marginTop: 4 },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.cancelActionText, { color: theme.textMuted }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md + 4,
    marginBottom: Spacing.sm + 2,
    gap: Spacing.xs + 3,
  },
  avatarPressable: {
    position: 'relative',
    marginBottom: 2,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  avatarInitialText: {
    fontSize: 34,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCol: {
    alignItems: 'center',
    gap: 3,
  },
  nameText: {
    fontSize: Typography.title,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  usernameText: {
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },
  majorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  majorText: {
    fontSize: Typography.caption,
    fontWeight: '600',
  },
  bioText: {
    fontSize: Typography.caption,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
    marginTop: 3,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: 4,
  },
  editProfileBtnText: {
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm + 2,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statValue: {
    fontSize: Typography.body + 2,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: Typography.caption - 1,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  sectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: Typography.caption - 1,
    marginTop: 1,
  },
  goalPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  goalPillText: {
    fontSize: Typography.caption,
    fontWeight: '800',
  },
  progressBarWrapper: {
    gap: 4,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  progressHint: {
    fontSize: Typography.caption - 1,
    fontWeight: '600',
  },
  goalOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  goalOptionLabel: {
    fontSize: Typography.caption - 1,
    fontWeight: '600',
  },
  goalChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  goalChipText: {
    fontSize: Typography.caption - 1,
  },
  photoPickerModalSheet: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md + 2,
    gap: Spacing.sm + 2,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  photoOptionsList: {
    gap: 10,
    paddingVertical: 4,
  },
  photoOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 12,
  },
  photoOptionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOptionTextCol: {
    flex: 1,
    gap: 2,
  },
  photoOptionTitle: {
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  photoOptionSub: {
    fontSize: Typography.caption - 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  settingIconBg: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextCol: {
    flex: 1,
    gap: 1,
  },
  settingTitle: {
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: Typography.caption - 1,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalSheet: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    maxHeight: '88%',
    padding: Spacing.md + 2,
    gap: Spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 2,
  },
  modalTitle: {
    fontSize: Typography.body + 2,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: Typography.caption,
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    gap: Spacing.sm + 2,
    paddingVertical: 4,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 10,
  },
  miniAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoRowTitle: {
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },
  photoRowSub: {
    fontSize: Typography.caption - 1,
  },
  changePhotoPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  changePhotoPillText: {
    color: '#FFFFFF',
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: Typography.caption - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCountText: {
    fontSize: Typography.caption - 2,
    fontWeight: '600',
  },
  textInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: Typography.body - 1,
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  prefixAt: {
    fontSize: Typography.body,
    fontWeight: '800',
  },
  bareInput: {
    flex: 1,
    fontSize: Typography.body - 1,
    paddingVertical: 10,
  },
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 6,
  },
  textArea: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: Typography.body - 1,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  passwordErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: Radius.md,
  },
  passwordErrorText: {
    color: '#EF4444',
    fontSize: Typography.caption,
    fontWeight: '600',
    flex: 1,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  cancelActionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelActionText: {
    fontSize: Typography.body - 1,
    fontWeight: '600',
  },
  saveActionBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveActionText: {
    color: '#FFFFFF',
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});