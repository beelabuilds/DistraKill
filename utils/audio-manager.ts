import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type RingtoneItem = {
  id: string;
  name: string;
  subtitle: string;
  durationText: string;
  icon: string;
  color: string;
  source: any;
};

export const RINGTONE_STORAGE_KEY = '@distrakill_focus_ringtone';

export const RINGTONE_LIST: RingtoneItem[] = [
  {
    id: 'marimba_delight',
    name: 'Marimba Melody',
    subtitle: 'Bright & uplifting 8-note marimba chime',
    durationText: '6.0s',
    icon: 'musical-notes',
    color: '#F59E0B',
    source: require('@/assets/sounds/marimba_delight.wav'),
  },
  {
    id: 'zen_bowl',
    name: 'Zen Singing Bowl',
    subtitle: 'Deep meditative Tibetan bowl resonance',
    durationText: '6.5s',
    icon: 'flower-outline',
    color: '#10B981',
    source: require('@/assets/sounds/zen_bowl.wav'),
  },
  {
    id: 'celestial_harp',
    name: 'Celestial Harp',
    subtitle: 'Gentle cascading harmonic strings',
    durationText: '6.5s',
    icon: 'sparkles',
    color: '#8B5CF6',
    source: require('@/assets/sounds/celestial_harp.wav'),
  },
  {
    id: 'digital_pulse',
    name: 'Digital Focus Alert',
    subtitle: 'Futuristic electronic rhythmic alert',
    durationText: '5.5s',
    icon: 'radio-outline',
    color: '#06B6D4',
    source: require('@/assets/sounds/digital_pulse.wav'),
  },
  {
    id: 'gentle_chimes',
    name: 'Wind Chimes',
    subtitle: 'Crystal metallic chime notes with shimmer',
    durationText: '6.5s',
    icon: 'notifications',
    color: '#EC4899',
    source: require('@/assets/sounds/gentle_chimes.wav'),
  },
];

export const DEFAULT_RINGTONE_ID = 'marimba_delight';

let activePlayer: AudioPlayer | null = null;
let activeHtmlAudio: any = null;

/**
 * Stop any currently playing ringtone or preview
 */
export async function stopRingtone(): Promise<void> {
  if (activePlayer) {
    try {
      activePlayer.pause();
      activePlayer.release();
    } catch {
      // Ignore
    }
    activePlayer = null;
  }

  if (activeHtmlAudio) {
    try {
      activeHtmlAudio.pause();
      activeHtmlAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    activeHtmlAudio = null;
  }
}

/**
 * Get the currently selected ringtone ID from local storage
 */
export async function getSelectedRingtoneId(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(RINGTONE_STORAGE_KEY);
    if (saved && RINGTONE_LIST.some((r) => r.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore read errors
  }
  return DEFAULT_RINGTONE_ID;
}

/**
 * Save selected ringtone ID
 */
export async function saveSelectedRingtoneId(ringtoneId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(RINGTONE_STORAGE_KEY, ringtoneId);
  } catch (err) {
    console.error('Failed to save selected ringtone:', err);
  }
}

/**
 * Play a specific ringtone with onFinish callback
 */
export async function playRingtone(
  ringtoneId: string,
  onFinish?: () => void
): Promise<void> {
  await stopRingtone();

  const item =
    RINGTONE_LIST.find((r) => r.id === ringtoneId) || RINGTONE_LIST[0];

  try {
    // Mobile Native Haptics
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore unsupported
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Resolve Web URI from require()
      let uri = '';
      if (typeof item.source === 'string') {
        uri = item.source;
      } else if (item.source && typeof item.source === 'object') {
        uri = item.source.default || item.source.uri || '';
      }

      if (uri) {
        const audio = new Audio(uri);
        activeHtmlAudio = audio;
        audio.onended = () => {
          if (activeHtmlAudio === audio) activeHtmlAudio = null;
          onFinish?.();
        };
        await audio.play();
        return;
      }
    }

    // Native playback using expo-audio createAudioPlayer
    const player = createAudioPlayer(item.source);
    activePlayer = player;
    player.volume = 1.0;

    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        sub.remove();
        try {
          player.release();
        } catch {
          // Ignore
        }
        if (activePlayer === player) {
          activePlayer = null;
        }
        onFinish?.();
      }
    });

    player.play();
  } catch (err) {
    console.warn('[Audio] Failed playing ringtone via native player:', err);
    onFinish?.();
  }
}
