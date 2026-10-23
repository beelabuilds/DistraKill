import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export type TaskPdfAttachment = {
  name: string;
  uri: string;
  size?: number;
  base64Uri?: string;
};

/**
 * Universal PDF picker that works seamlessly on Web (Computer) and Mobile (Android / iOS).
 */
export async function pickPdfDocument(): Promise<TaskPdfAttachment | null> {
  // Web (Computer) specific picker implementation
  if (Platform.OS === 'web') {
    return pickPdfOnWeb();
  }

  // Native (iOS & Android) picker implementation
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/x-pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      name: asset.name || 'Document.pdf',
      uri: asset.uri,
      size: asset.size ?? 0,
    };
  } catch (err) {
    console.error('Failed to pick document on native device:', err);
    Alert.alert('File Picker Error', 'Could not open native document picker.');
    return null;
  }
}

/**
 * Robust Web HTML5 File Picker with FileReader conversion for 100% reliable computer access
 */
function pickPdfOnWeb(): Promise<TaskPdfAttachment | null> {
  return new Promise((resolve) => {
    try {
      if (typeof document === 'undefined') {
        resolve(null);
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf,.pdf';
      input.style.display = 'none';

      let resolved = false;

      input.onchange = () => {
        if (resolved) return;
        resolved = true;

        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          cleanup();
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
          const objectUrl = URL.createObjectURL(file);

          resolve({
            name: file.name || 'Study Document.pdf',
            uri: objectUrl,
            size: file.size,
            // Keep base64Uri if reasonably sized for instant Firestore/AsyncStorage persistence
            base64Uri:
              dataUrl.length > 0 && dataUrl.length <= 800_000
                ? dataUrl
                : undefined,
          });
          cleanup();
        };

        reader.onerror = (readerErr) => {
          console.warn('FileReader error on web:', readerErr);
          const objectUrl = URL.createObjectURL(file);
          resolve({
            name: file.name,
            uri: objectUrl,
            size: file.size,
          });
          cleanup();
        };

        reader.readAsDataURL(file);
      };

      const cleanup = () => {
        try {
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
        } catch {
          // ignore cleanup errors
        }
      };

      document.body.appendChild(input);
      input.click();
    } catch (err) {
      console.error('Error in pickPdfOnWeb:', err);
      resolve(null);
    }
  });
}

/**
 * Universal PDF Viewer / Opener
 */
export async function openPdfDocument(pdf: TaskPdfAttachment): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;

      // If we have base64Uri, convert it to a fresh Blob object URL
      if (pdf.base64Uri && pdf.base64Uri.startsWith('data:')) {
        try {
          const parts = pdf.base64Uri.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
          const b64Data = parts[1];
          const byteCharacters = atob(b64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mime });
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          return;
        } catch (blobErr) {
          console.warn('Blob creation from base64 failed, falling back to window.open data URI:', blobErr);
          window.open(pdf.base64Uri, '_blank');
          return;
        }
      }

      // If regular URI
      if (pdf.uri) {
        window.open(pdf.uri, '_blank');
        return;
      }

      Alert.alert('Error', 'No valid PDF link found for this task.');
      return;
    }

    // Native Mobile (iOS / Android)
    const canShare = await Sharing.isAvailableAsync();
    if (canShare && pdf.uri) {
      await Sharing.shareAsync(pdf.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `View ${pdf.name}`,
        UTI: 'com.adobe.pdf',
      });
      return;
    }

    if (pdf.uri) {
      const canOpen = await Linking.canOpenURL(pdf.uri);
      if (canOpen) {
        await Linking.openURL(pdf.uri);
        return;
      }
    }

    Alert.alert('Notice', 'No compatible PDF viewer found on this device.');
  } catch (err) {
    console.error('Error opening PDF document:', err);
    Alert.alert('Error', 'Could not open this PDF document.');
  }
}
