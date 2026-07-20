import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'YOUR_REAL_API_KEY',
  authDomain: 'YOUR_REAL_AUTH_DOMAIN',
  projectId: 'YOUR_REAL_PROJECT_ID',
  storageBucket: 'YOUR_REAL_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_REAL_MESSAGING_SENDER_ID',
  appId: 'YOUR_REAL_APP_ID',
};

const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export default firebaseApp;