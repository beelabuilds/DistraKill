import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';
import {
  openPdfDocument,
  pickPdfDocument,
  type TaskPdfAttachment,
} from '@/utils/pdf-utils';
import {
  formatFileSize,
  formatFriendlyDate,
  PRIORITY_COLORS,
  SUBJECT_OPTIONS,
  type SubjectType,
} from '@/utils/planner-utils';

import type { PlannerTask } from './task-item';

type TaskCreateModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // "YYYY-MM-DD"
  taskToEdit?: PlannerTask | null;
  onSubmit: (task: {
    id?: string;
    title: string;
    subject: string;
    priority: 'low' | 'medium' | 'high';
    estimatedMinutes: number;
    date: string;
    pdfAttachment?: TaskPdfAttachment | null;
  }) => Promise<void> | void;
  loading?: boolean;
};

const DURATION_PRESETS = [15, 25, 45, 60];

export function TaskCreateModal({
  visible,
  onClose,
  selectedDate,
  taskToEdit,
  onSubmit,
  loading = false,
}: TaskCreateModalProps) {
  const theme = useAuthTheme();
  const isEditMode = Boolean(taskToEdit);

  const [title, setTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('General');
  const [customSubject, setCustomSubject] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [duration, setDuration] = useState(25);
  const [pdfAttachment, setPdfAttachment] = useState<TaskPdfAttachment | null>(null);
  const [isPickingPdf, setIsPickingPdf] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      const isPreset = SUBJECT_OPTIONS.some(
        (s) =>
          s !== 'Other' &&
          s.toLowerCase() === (taskToEdit.subject || '').toLowerCase()
      );
      if (isPreset) {
        setSelectedSubject(taskToEdit.subject || 'General');
        setCustomSubject('');
      } else if (taskToEdit.subject) {
        setSelectedSubject('Other');
        setCustomSubject(taskToEdit.subject);
      } else {
        setSelectedSubject('General');
        setCustomSubject('');
      }
      setPriority(taskToEdit.priority || 'medium');
      setDuration(taskToEdit.estimatedMinutes || 25);
      setPdfAttachment(taskToEdit.pdfAttachment || null);
    } else {
      setTitle('');
      setSelectedSubject('General');
      setCustomSubject('');
      setPriority('medium');
      setDuration(25);
      setPdfAttachment(null);
    }
    setError('');
  }, [taskToEdit, visible]);

  const handlePickPdf = async () => {
    try {
      setIsPickingPdf(true);
      setError('');
      const picked = await pickPdfDocument();
      if (picked) {
        setPdfAttachment(picked);
      }
    } catch (err) {
      console.error('Error attaching PDF in modal:', err);
      Alert.alert('File Picker', 'Unable to select this PDF document.');
    } finally {
      setIsPickingPdf(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (pdfAttachment) {
      await openPdfDocument(pdfAttachment);
    }
  };

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a task title.');
      return;
    }

    setError('');
    const finalSubject =
      selectedSubject === 'Other'
        ? customSubject.trim() || 'Other'
        : selectedSubject;

    await onSubmit({
      id: taskToEdit?.id,
      title: trimmed,
      subject: finalSubject,
      priority,
      estimatedMinutes: duration,
      date: taskToEdit?.date || selectedDate,
      pdfAttachment,
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {isEditMode ? 'Edit Task' : 'New Study Task'}
              </Text>
              <Text style={[styles.headerDate, { color: theme.primary }]}>
                {formatFriendlyDate(taskToEdit?.date || selectedDate)}
              </Text>
            </View>

            <Pressable hitSlop={10} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            {/* Title Input */}
            <TextInput
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (error) setError('');
              }}
              placeholder="What are you studying? (e.g. Chapter 4 Exercises)"
              placeholderTextColor={theme.textMuted}
              autoFocus={!isEditMode}
              returnKeyType="done"
              style={[
                styles.input,
                {
                  backgroundColor: theme.surfaceSoft,
                  borderColor: error ? theme.error : theme.border,
                  color: theme.text,
                },
              ]}
            />
            {error ? (
              <Text style={[styles.errorText, { color: theme.error }]}>
                {error}
              </Text>
            ) : null}

            {/* Subject Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                Subject
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalRow}
              >
                {SUBJECT_OPTIONS.map((sub) => {
                  const isSelected = selectedSubject === sub;
                  return (
                    <Pressable
                      key={sub}
                      onPress={() => setSelectedSubject(sub)}
                      style={[
                        styles.chip,
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
                          styles.chipText,
                          {
                            color: isSelected ? theme.buttonText : theme.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {sub}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {selectedSubject === 'Other' ? (
                <TextInput
                  value={customSubject}
                  onChangeText={setCustomSubject}
                  placeholder="Enter custom subject (e.g. Biology, History, Law)..."
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="done"
                  style={[
                    styles.input,
                    styles.customSubjectInput,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                />
              ) : null}
            </View>

            {/* Priority & Duration Row */}
            <View style={styles.twoColumnRow}>
              {/* Priority */}
              <View style={styles.columnSection}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                  Priority
                </Text>
                <View style={styles.priorityGroup}>
                  {(['low', 'medium', 'high'] as const).map((p) => {
                    const isSelected = priority === p;
                    const colors = PRIORITY_COLORS[p];
                    return (
                      <Pressable
                        key={p}
                        onPress={() => setPriority(p)}
                        style={[
                          styles.priorityPill,
                          {
                            backgroundColor: isSelected
                              ? colors.bg
                              : theme.surfaceSoft,
                            borderColor: isSelected ? colors.border : theme.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.priorityDot,
                            { backgroundColor: colors.text },
                          ]}
                        />
                        <Text
                          style={[
                            styles.priorityText,
                            {
                              color: isSelected ? colors.text : theme.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Duration */}
              <View style={styles.columnSection}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                  Duration
                </Text>
                <View style={styles.durationGroup}>
                  {DURATION_PRESETS.map((mins) => {
                    const isSelected = duration === mins;
                    return (
                      <Pressable
                        key={mins}
                        onPress={() => setDuration(mins)}
                        style={[
                          styles.durationPill,
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
                            styles.durationText,
                            {
                              color: isSelected ? theme.buttonText : theme.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {mins}m
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Attached PDF Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                PDF Material
              </Text>

              {pdfAttachment ? (
                <View
                  style={[
                    styles.pdfPillCard,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.pdfMiniIcon}>
                    <Ionicons name="document-text" size={16} color="#EF4444" />
                  </View>

                  <View style={styles.pdfTextCol}>
                    <Text
                      numberOfLines={1}
                      style={[styles.pdfTitle, { color: theme.text }]}
                    >
                      {pdfAttachment.name}
                    </Text>
                    <Text style={[styles.pdfSize, { color: theme.textMuted }]}>
                      {formatFileSize(pdfAttachment.size)}
                    </Text>
                  </View>

                  <Pressable
                    hitSlop={6}
                    onPress={handlePreviewPdf}
                    style={styles.pdfActionBtn}
                  >
                    <Ionicons name="eye-outline" size={15} color={theme.primary} />
                  </Pressable>

                  <Pressable
                    hitSlop={6}
                    onPress={() => setPdfAttachment(null)}
                    style={styles.pdfActionBtn}
                  >
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  disabled={isPickingPdf}
                  onPress={handlePickPdf}
                  style={({ pressed }) => [
                    styles.attachButton,
                    {
                      backgroundColor: theme.surfaceSoft,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  {isPickingPdf ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <Ionicons
                        name="attach-outline"
                        size={17}
                        color={theme.primary}
                      />
                      <Text
                        style={[
                          styles.attachButtonText,
                          { color: theme.text },
                        ]}
                      >
                        Attach PDF document
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </ScrollView>

          {/* Action Row */}
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              disabled={loading}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: theme.primary },
                (pressed || loading) && styles.pressed,
              ]}
            >
              <Text style={[styles.saveBtnText, { color: theme.buttonText }]}>
                {loading
                  ? 'Saving...'
                  : isEditMode
                  ? 'Save Changes'
                  : 'Add Task'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  sheet: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    maxHeight: '85%',
    padding: Spacing.md + 2,
    gap: Spacing.sm + 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: Typography.body + 2,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerDate: {
    fontSize: Typography.caption,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    gap: Spacing.sm + 2,
    paddingVertical: 4,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: Typography.body - 1,
  },
  customSubjectInput: {
    paddingVertical: 9,
    marginTop: 4,
  },
  errorText: {
    fontSize: Typography.caption,
    fontWeight: '600',
    marginTop: -4,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: Typography.caption - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  horizontalRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Typography.caption,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  columnSection: {
    flex: 1,
    gap: 6,
  },
  priorityGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  priorityText: {
    fontSize: Typography.caption - 1,
  },
  durationGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  durationPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  durationText: {
    fontSize: Typography.caption - 1,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  attachButtonText: {
    fontSize: Typography.caption + 1,
    fontWeight: '600',
  },
  pdfPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
  },
  pdfMiniIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfTextCol: {
    flex: 1,
    gap: 1,
  },
  pdfTitle: {
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  pdfSize: {
    fontSize: Typography.caption - 2,
  },
  pdfActionBtn: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: Typography.body - 1,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
