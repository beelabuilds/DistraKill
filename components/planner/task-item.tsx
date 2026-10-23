import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';
import { openPdfDocument, type TaskPdfAttachment } from '@/utils/pdf-utils';
import { formatFileSize, PRIORITY_COLORS } from '@/utils/planner-utils';

export type PlannerTask = {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  subject?: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
  completed: boolean;
  createdAt: number;
  pdfAttachment?: TaskPdfAttachment | null;
};

type TaskItemProps = {
  task: PlannerTask;
  onToggle: (task: PlannerTask) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: PlannerTask) => void;
};

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
}: TaskItemProps) {
  const theme = useAuthTheme();

  const priorityKey = task.priority || 'medium';
  const priorityStyle = PRIORITY_COLORS[priorityKey];

  const handleOpenPdf = async () => {
    if (task.pdfAttachment) {
      await openPdfDocument(task.pdfAttachment);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: task.completed ? 0.7 : 1,
        },
      ]}
    >
      {/* Checkbox */}
      <Pressable
        hitSlop={8}
        onPress={() => onToggle(task)}
        style={styles.checkboxBtn}
      >
        <Ionicons
          name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={task.completed ? theme.primary : theme.textMuted}
        />
      </Pressable>

      {/* Main Content */}
      <View style={styles.contentCol}>
        <Text
          style={[
            styles.titleText,
            {
              color: task.completed ? theme.textMuted : theme.text,
              textDecorationLine: task.completed ? 'line-through' : 'none',
            },
          ]}
        >
          {task.title}
        </Text>

        {/* Metadata inline: Subject • Priority • Duration */}
        <View style={styles.metaRow}>
          {task.subject ? (
            <Text style={[styles.metaText, { color: theme.textMuted }]}>
              {task.subject}
            </Text>
          ) : null}

          <View style={styles.dotSeparator} />

          <View style={styles.priorityInline}>
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: priorityStyle.text },
              ]}
            />
            <Text
              style={[styles.metaText, { color: priorityStyle.text, fontWeight: '700' }]}
            >
              {priorityKey.charAt(0).toUpperCase() + priorityKey.slice(1)}
            </Text>
          </View>

          {task.estimatedMinutes ? (
            <>
              <View style={styles.dotSeparator} />
              <Text style={[styles.metaText, { color: theme.textMuted }]}>
                {task.estimatedMinutes}m
              </Text>
            </>
          ) : null}
        </View>

        {/* Attached PDF Pill */}
        {task.pdfAttachment ? (
          <Pressable
            hitSlop={6}
            onPress={handleOpenPdf}
            style={({ pressed }) => [
              styles.pdfPill,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: theme.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="document-text" size={13} color="#EF4444" />
            <Text
              numberOfLines={1}
              style={[styles.pdfName, { color: theme.text }]}
            >
              {task.pdfAttachment.name}
            </Text>
            <Text style={[styles.pdfSize, { color: theme.textMuted }]}>
              ({formatFileSize(task.pdfAttachment.size)})
            </Text>
            <Ionicons name="open-outline" size={12} color={theme.primary} />
          </Pressable>
        ) : null}
      </View>

      {/* Action Buttons: Edit & Delete */}
      <View style={styles.actionsRow}>
        <Pressable
          hitSlop={8}
          onPress={() => onEdit(task)}
          style={styles.iconBtn}
        >
          <Ionicons name="pencil-outline" size={17} color={theme.textMuted} />
        </Pressable>

        <Pressable
          hitSlop={8}
          onPress={() => onDelete(task.id)}
          style={styles.iconBtn}
        >
          <Ionicons name="trash-outline" size={17} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  checkboxBtn: {
    paddingTop: 1,
  },
  contentCol: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontSize: Typography.body - 1,
    fontWeight: '600',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: Typography.caption - 1,
    fontWeight: '500',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#88888855',
  },
  priorityInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pdfPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: 2,
    maxWidth: '95%',
  },
  pdfName: {
    fontSize: Typography.caption - 1,
    fontWeight: '600',
    flexShrink: 1,
  },
  pdfSize: {
    fontSize: Typography.caption - 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 1,
  },
  iconBtn: {
    padding: 4,
  },
  pressed: {
    opacity: 0.75,
  },
});
