import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyDYhFE5gf9IlZIJxaVE9bcxFBmm-oYqh88',
  authDomain: 'distrakill.firebaseapp.com',
  projectId: 'distrakill',
  storageBucket: 'distrakill.firebasestorage.app',
  messagingSenderId: '526942721895',
  appId: '1:526942721895:web:1e7d26bfe4f5481e7b41c2',
  measurementId: 'G-QL2RSW9Q1E',
};

const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

if (Platform.OS === 'web' && __DEV__) {
  const debugGlobal = globalThis as typeof globalThis & {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean;
  };
  debugGlobal.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

  void import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
    try {
      initializeAppCheck(firebaseApp, {
        // Debug mode exchanges the generated debug token and does not use this placeholder as a production key.
        provider: new ReCaptchaV3Provider('debug-localhost'),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      // Fast Refresh can re-run this module after App Check has already initialized.
      if (__DEV__) {
        console.debug('Firebase App Check is already initialized for this app session.', error);
      }
    }
  }).catch((error: unknown) => {
    console.warn('Firebase App Check debug initialization failed:', error);
  });
}

export default firebaseApp;