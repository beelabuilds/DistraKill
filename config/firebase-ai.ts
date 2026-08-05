import {
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';

import {
  CustomProvider,
  initializeAppCheck,
} from 'firebase/app-check';

import { Platform } from 'react-native';

const AI_APP_NAME = 'distrakill-ai';

const aiFirebaseConfig = {
  apiKey: 'AIzaSyC2d8HJ6aqHlq5UnXSY_XDi9Tj_QnBL8Ic',
  authDomain: 'distrakill-ai.firebaseapp.com',
  projectId: 'distrakill-ai',
  storageBucket: 'distrakill-ai.firebasestorage.app',
  messagingSenderId: '457486368518',
  appId: '1:457486368518:web:668d83519bdb3aaa982887',
};

const aiFirebaseApp =
  getApps().some(
    (app) => app.name === AI_APP_NAME,
  )
    ? getApp(AI_APP_NAME)
    : initializeApp(
        aiFirebaseConfig,
        AI_APP_NAME,
      );

type AppCheckDebugGlobal =
  typeof globalThis & {
    FIREBASE_APPCHECK_DEBUG_TOKEN?:
      | boolean
      | string;

    __DISTRAKILL_AI_APP_CHECK_INITIALIZED__?:
      boolean;
  };

if (Platform.OS === 'web' && __DEV__) {
  const debugGlobal =
    globalThis as AppCheckDebugGlobal;

  if (
    !debugGlobal
      .__DISTRAKILL_AI_APP_CHECK_INITIALIZED__
  ) {
    debugGlobal.FIREBASE_APPCHECK_DEBUG_TOKEN =
      true;

    initializeAppCheck(aiFirebaseApp, {
      // During localhost development, Firebase uses
      // the debug token instead of this provider.
      provider: new CustomProvider({
        getToken: async () => {
          throw new Error(
            'App Check debug mode was not activated.',
          );
        },
      }),

      isTokenAutoRefreshEnabled: true,
    });

    debugGlobal
      .__DISTRAKILL_AI_APP_CHECK_INITIALIZED__ =
      true;
  }
}

export default aiFirebaseApp;
