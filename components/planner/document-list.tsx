import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';
import { formatFileSize, formatFriendlyDate } from '@/utils/planner-utils';

export type StudyDocument = {
  id: string;
  name: string;
  uri: string;
  size?: number;
  date: string; // "YYYY-MM-DD"
  uploadedAt: number;
};

type DocumentListProps = {
  documents: StudyDocument[];
  selectedDate: string;
  onAttachDocument: (doc: Omit<StudyDocument, 'id'>) => Promise<void> | void;
  onDeleteDocument: (docId: string) => Promise<void> | void;
  loading?: boolean;
};

export function DocumentList({
  documents,
  selectedDate,
  onAttachDocument,
  onDeleteDocument,
  loading = false,
}: DocumentListProps) {
  const theme = useAuthTheme();
  const [isPicking, setIsPicking] = useState(false);

  const handlePickDocument = async () => {
    try {
      setIsPicking(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await onAttachDocument({
          name: file.name || 'Study Document.pdf',
          uri: file.uri,
          size: file.size ?? 0,
          date: selectedDate,
          uploadedAt: Date.now(),
        });
        Alert.alert('PDF Attached 🎉', `"${file.name}" has been linked to ${formatFriendlyDate(selectedDate)}.`);
      }
    } catch (err: any) {
      console.error('Error picking document:', err);
      Alert.alert('Attachment Error', 'Could not access or attach the selected PDF file.');
    } finally {
      setIsPicking(false);
    }
  };

  const handleOpenDocument = async (doc: StudyDocument) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.open(doc.uri, '_blank');
        } else {
          void Linking.openURL(doc.uri);
        }
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(doc.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `View ${doc.name}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        const supported = await Linking.canOpenURL(doc.uri);
        if (supported) {
          await Linking.openURL(doc.uri);
        } else {
          Alert.alert('Notice', 'No PDF viewer app found on this device to open the file.');
        }
      }
    } catch (err) {
      console.error('Error opening document:', err);
      Alert.alert('Error', 'Unable to open this PDF document.');
    }
  };

  const confirmDelete = (doc: StudyDocument) => {
    Alert.alert(
      'Remove PDF Attachment',
      `Are you sure you want to remove "${doc.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onDeleteDocument(doc.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            PDF Attachments & Notes
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
            Attached to {formatFriendlyDate(selectedDate)}
          </Text>
        </View>

        <Pressable
          disabled={isPicking}
          onPress={handlePickDocument}
          style={({ pressed }) => [
            styles.attachBtn,
            { backgroundColor: theme.primary },
            (pressed || isPicking) && styles.pressed,
          ]}
        >
          {isPicking ? (
            <ActivityIndicator size="small" color={theme.buttonText} />
          ) : (
            <>
              <Ionicons name="document-attach-outline" size={16} color={theme.buttonText} />
              <Text style={[styles.attachBtnText, { color: theme.buttonText }]}>
                Attach PDF
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Documents List */}
      {loading && documents.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Loading attachments...
          </Text>
        </View>
      ) : documents.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.emptyIconBg,
              { backgroundColor: theme.surfaceSoft },
            ]}
          >
            <Ionicons name="document-text-outline" size={28} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No PDFs attached for this date
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Attach lecture slides, formulas, or assignments for quick revision.
          </Text>

          <Pressable
            disabled={isPicking}
            onPress={handlePickDocument}
            style={({ pressed }) => [
              styles.emptyActionBtn,
              { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={theme.primary} />
            <Text style={[styles.emptyActionText, { color: theme.text }]}>
              Upload PDF File
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {documents.map((doc) => (
            <View
              key={doc.id}
              style={[
                styles.docCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              {/* PDF Icon Badge */}
              <View style={styles.pdfBadge}>
                <Ionicons name="document" size={24} color="#EF4444" />
                <Text style={styles.pdfLabel}>PDF</Text>
              </View>

              {/* Doc Info */}
              <Pressable
                style={styles.docInfo}
                onPress={() => handleOpenDocument(doc)}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.docName, { color: theme.text }]}
                >
                  {doc.name}
                </Text>
                <Text style={[styles.docMeta, { color: theme.textMuted }]}>
                  {formatFileSize(doc.size)} • Tap to open
                </Text>
              </Pressable>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  hitSlop={8}
                  onPress={() => handleOpenDocument(doc)}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    { backgroundColor: theme.surfaceSoft },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="open-outline" size={18} color={theme.primary} />
                </Pressable>

                <Pressable
                  hitSlop={8}
                  onPress={() => confirmDelete(doc)}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    { backgroundColor: '#FEE2E2' },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  titleCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.body + 1,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: Typography.caption,
    fontWeight: '600',
    marginTop: 1,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  attachBtnText: {
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },
  emptyCard: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyIconBg: {
    width: 50,
    height: 50,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: Typography.body,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: Typography.caption,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  emptyActionText: {
    fontSize: Typography.caption + 1,
    fontWeight: '700',
  },
  list: {
    gap: Spacing.xs + 2,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  pdfBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
  },
  pdfLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#EF4444',
    marginTop: -2,
  },
  docInfo: {
    flex: 1,
    gap: 2,
  },
  docName: {
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  docMeta: {
    fontSize: Typography.caption,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.body - 1,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
