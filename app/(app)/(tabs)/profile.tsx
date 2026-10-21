import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/auth/screen-container';
import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuth } from '@/contexts/auth-context';
import { useAuthTheme } from '@/hooks/use-auth-theme';

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useAuthTheme();
  const { logout, user } = useAuth();

  // Settings Toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  // Core Profile Info
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [name, setName] = useState(user?.name ?? 'Salsabil Ahmed');
  const [username, setUsername] = useState('salsabil_focus');
  const [email, setEmail] = useState(user?.email ?? 'salsabil@iut-dhaka.edu');

  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Load saved profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('@distrakill_user_profile');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.avatarUri) setAvatarUri(parsed.avatarUri);
          if (parsed.name) setName(parsed.name);
          if (parsed.username) setUsername(parsed.username);
          if (parsed.email) setEmail(parsed.email);
        }
      } catch (err) {
        console.log('Error loading saved profile:', err);
      }
    };
    loadProfileData();
  }, []);

  const handleOpenEditModal = () => {
    setEditName(name);
    setEditUsername(username);
    setEditEmail(email);
    setIsEditing(true);
  };

  // Image Picking - Gallery
  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Gallery access permission is needed to select a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const newUri = result.assets[0].uri;
      setAvatarUri(newUri);
      await saveAvatarUriToStorage(newUri);
    }
  };

  // Image Picking - Camera
  const takePhotoWithCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera access permission is needed to take a profile photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const newUri = result.assets[0].uri;
      setAvatarUri(newUri);
      await saveAvatarUriToStorage(newUri);
    }
  };

  const saveAvatarUriToStorage = async (uri: string | null) => {
    try {
      const savedData = await AsyncStorage.getItem('@distrakill_user_profile');
      const current = savedData ? JSON.parse(savedData) : {};
      await AsyncStorage.setItem('@distrakill_user_profile', JSON.stringify({ ...current, avatarUri: uri }));
    } catch (e) {
      console.log('Error saving avatar:', e);
    }
  };

  const handlePhotoPress = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option:',
      [
        { text: '🖼️ Choose from Gallery', onPress: pickImageFromGallery },
        { text: '📷 Take Photo', onPress: takePhotoWithCamera },
        ...(avatarUri
          ? [
              {
                text: '🗑️ Remove Photo',
                style: 'destructive' as const,
                onPress: async () => {
                  setAvatarUri(null);
                  await saveAvatarUriToStorage(null);
                },
              },
            ]
          : []),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSaveProfile = async () => {
    const cleanName = editName.trim() || name;
    const cleanUsername = editUsername.trim().replace(/^@/, '') || username;
    const cleanEmail = editEmail.trim() || email;

    setName(cleanName);
    setUsername(cleanUsername);
    setEmail(cleanEmail);

    try {
      const profileToSave = {
        avatarUri,
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
      };
      await AsyncStorage.setItem('@distrakill_user_profile', JSON.stringify(profileToSave));
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile changes.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome' as never);
  };

  return (
    <ScreenContainer scrollable>
      {/* 🖼️ Avatar & Header Info */}
      <View style={styles.heroSection}>
        <View style={styles.avatarWrapper}>
          <Pressable onPress={handlePhotoPress} accessibilityLabel="Change Profile Photo">
            <View style={[styles.avatarBubble, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {name.slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
          </Pressable>

          <Pressable
            onPress={handlePhotoPress}
            style={({ pressed }) => [
              styles.avatarEditBadge,
              { backgroundColor: theme.primary, borderColor: theme.surface },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={[styles.nameTitle, { color: theme.text }]}>{name}</Text>
        <Text style={[styles.handleText, { color: theme.primary }]}>@{username}</Text>
        <Text style={[styles.emailText, { color: theme.textMuted }]}>{email}</Text>

        {!isEditing && (
          <Pressable
            onPress={handleOpenEditModal}
            style={({ pressed }) => [
              styles.editBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="create-outline" size={16} color={theme.primary} />
            <Text style={[styles.editBtnText, { color: theme.text }]}>Edit Profile</Text>
          </Pressable>
        )}
      </View>

      {/* ⚙️ Preferences & Account Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Account Settings</Text>

        <View style={styles.listItem}>
          <Ionicons name="notifications-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.text }]}>Focus Reminders</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>

        <Pressable
          onPress={() => setIsSecurityOpen(true)}
          style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.text }]}>Security Settings</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </Pressable>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Sign Out Button */}
        <Pressable
          style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
          <Text style={[styles.listText, { color: theme.error, fontWeight: '700' }]}>Sign Out</Text>
        </Pressable>
      </View>

      {/* 🪟 Simple Edit Profile Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Edit Profile</Text>
              <Pressable onPress={() => setIsEditing(false)}>
                <Ionicons name="close-circle" size={24} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Photo Change Row */}
            <View style={styles.photoPickerRow}>
              <View style={[styles.smallAvatar, { borderColor: theme.primary, backgroundColor: theme.surfaceSoft }]}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarText, { fontSize: 20, color: theme.primary }]}>
                    {(editName || 'S').slice(0, 1).toUpperCase()}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={handlePhotoPress}
                style={({ pressed }) => [
                  styles.photoSelectBtn,
                  { backgroundColor: theme.primary },
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="image-outline" size={16} color="#FFFFFF" />
                <Text style={styles.photoSelectBtnText}>Change Photo</Text>
              </Pressable>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter name"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Username</Text>
              <View style={[styles.inputWithIcon, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}>@</Text>
                <TextInput
                  style={[styles.inputBare, { color: theme.text }]}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="username"
                  autoCapitalize="none"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => setIsEditing(false)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.actionBtnText, { color: theme.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveProfile}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: theme.primary },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.actionBtnText, { color: '#FFFFFF', fontWeight: '800' }]}>
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔒 Security Modal */}
      <Modal
        visible={isSecurityOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSecurityOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Security Settings</Text>
              <Pressable onPress={() => setIsSecurityOpen(false)}>
                <Ionicons name="close-circle" size={24} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={styles.listItem}>
              <Ionicons name="finger-print-outline" size={20} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.listText, { color: theme.text, fontWeight: '600' }]}>Biometric Unlock</Text>
                <Text style={{ fontSize: Typography.caption, color: theme.textMuted }}>Face ID / Fingerprint</Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Current Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>New Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <Pressable
              onPress={() => {
                if (newPassword) {
                  Alert.alert('Success', 'Password updated successfully!');
                }
                setIsSecurityOpen(false);
              }}
              style={({ pressed }) => [
                styles.doneBtn,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.doneBtnText, { color: theme.buttonText }]}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  avatarWrapper: {
    alignSelf: 'center',
    position: 'relative',
  },
  avatarBubble: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: Radius.pill,
    height: 84,
    justifyContent: 'center',
    width: 84,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: Typography.title + 10,
    fontWeight: '800',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  nameTitle: {
    fontSize: Typography.title,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  handleText: {
    fontSize: Typography.body - 1,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  emailText: {
    fontSize: Typography.caption + 1,
    marginTop: 2,
    textAlign: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  editBtnText: {
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },
  profileCard: {
    borderRadius: Radius.md,
    gap: Spacing.sm + 2,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
  },
  listItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  listText: {
    fontSize: Typography.body - 1,
    flex: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.md + 4,
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  smallAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
  },
  photoSelectBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: Typography.caption + 1,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm + 2,
    borderWidth: 1,
    fontSize: Typography.body - 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm + 2,
    borderWidth: 1,
    gap: 4,
  },
  inputBare: {
    flex: 1,
    fontSize: Typography.body - 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: Typography.button - 1,
    fontWeight: '700',
  },
  doneBtn: {
    height: 48,
    width: '100%',
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  doneBtnText: {
    fontSize: Typography.button,
    fontWeight: '800',
  },
});
