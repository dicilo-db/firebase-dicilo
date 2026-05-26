import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'geosearch-fq4i9',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:382703499489:web:88d6bf76f4cffe84d15fa0',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'geosearch-fq4i9.firebasestorage.app',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCCGBqtGt-sefut4RHfwaTs4bDGCfPjp9E',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'geosearch-fq4i9.firebaseapp.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '382703499489',
};

function initializeFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export const app: FirebaseApp = initializeFirebaseApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
