import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  //Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');


  const handlePickImage = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        {
          text: 'Use Sample Avatar',
          onPress: () => setAvatarUri('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
        },
        {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => setAvatarUri(null),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome' as never);
  };

  //Handle Save Profile
  const handleSaveProfile = () => {
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };


  return (
    <ScreenContainer scrollable>

      {/* 🖼️ Single Profile Header & Avatar */}
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatarBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {(user?.name ?? 'S').slice(0, 1).toUpperCase()}
            </Text>
          )}
        </View>

        {/* Camera Overlay Icon - Directly Opens Image Selection */}
        <Pressable
          onPress={handlePickImage}
          style={({ pressed }) => [
            styles.avatarEditBadge,
            { backgroundColor: theme.primary, borderColor: theme.surface },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
        </Pressable>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>{user?.name ?? 'Student User'}</Text>
      <Text style={[styles.description, { color: theme.textMuted }]}>{user?.email ?? 'student@school.edu'}</Text>

      {/*Edit Profile Toggle Button */}
      {!isEditing && (
        <Pressable
          onPress={() => setIsEditing(true)}
          style={({ pressed }) => [
            styles.editBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="create-outline" size={16} color={theme.text} />
          <Text style={[styles.editBtnText, { color: theme.text }]}>Edit Profile</Text>
        </Pressable>
      )}


      {/* ⚙️ Preferences & Settings Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Preferences & Account</Text>

        <View style={styles.listItem}>
          <Ionicons name="notifications-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.text }]}>Focus Reminders</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>


        <Pressable onPress={() => setIsSecurityOpen(true)} style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}>
          <Ionicons name="lock-closed-outline" size={18} color={theme.primary} />
          <Text style={[styles.listText, { color: theme.text }]}>Security Settings</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </Pressable>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* 🚪 Sign Out Button */}
        <Pressable
          style={({ pressed }) => [
            styles.listItem,
            { opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.error} />
          <Text style={[styles.listText, { color: theme.error, fontWeight: '700' }]}>Sign Out</Text>
        </Pressable>
      </View>
      {/* 🪟 EDIT PROFILE POPUP MODAL */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Edit Profile</Text>
              <Pressable onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Full Name / Username</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter name"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter email"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Password Fields */}
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
                <Text style={[styles.actionBtnText, { color: '#FFFFFF', fontWeight: '800' }]}>Save Changes</Text>
              </Pressable>
            </View>

          </View>
        </View>
      </Modal>

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
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Biometrics Toggle */}
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

            {/* 2FA Toggle */}
            <View style={styles.listItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.listText, { color: theme.text, fontWeight: '600' }]}>Two-Factor Authentication</Text>
                <Text style={{ fontSize: Typography.caption, color: theme.textMuted }}>SMS or Authenticator App</Text>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={setTwoFactorEnabled}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Active Sessions Action */}
            <Pressable
              style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}
              onPress={() => Alert.alert('Active Sessions', 'Logged in on 1 device (Mobile App).')}
            >
              <Ionicons name="hardware-chip-outline" size={20} color={theme.primary} />
              <Text style={[styles.listText, { color: theme.text }]}>Manage Active Devices</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </Pressable>

            {/* Close Button */}
            <Pressable
              onPress={() => setIsSecurityOpen(false)}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: theme.primary, marginTop: Spacing.sm },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.actionBtnText, { color: '#FFFFFF', fontWeight: '800' }]}>Done</Text>
            </Pressable>

          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: {
    alignSelf: 'center',
    position: 'relative',
  },
  avatarBubble: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: Radius.pill,
    height: 72,
    justifyContent: 'center',
    width: 72,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  avatarImage: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    fontSize: Typography.title + 8,
    fontWeight: '800',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.title + 2,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.body - 1,
    lineHeight: 22,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  profileCard: {
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md + 2,
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
  },
  listText: {
    fontSize: Typography.body - 1,
    flex: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  editBtnText: {
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.md * 1.5,
    borderTopRightRadius: Radius.md * 1.5,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: Typography.caption + 1,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
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
    fontSize: Typography.button,
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
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});