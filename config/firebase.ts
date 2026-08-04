import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

export default firebaseApp;