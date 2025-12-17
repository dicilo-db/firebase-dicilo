// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';

// Your web app's Firebase configuration
export const firebaseConfig = {
  projectId: 'geosearch-fq4i9',
  appId: '1:382703499489:web:88d6bf76f4cffe84d15fa0',
  storageBanner: 'geosearch-fq4i9.firebasestorage.app',
  storageBucket: 'geosearch-fq4i9.firebasestorage.app',
  apiKey: 'AIzaSyCCGBqtGt-sefut4RHfwaTs4bDGCfPjp9E',
  authDomain: 'geosearch-fq4i9.firebaseapp.com',
  messagingSenderId: '382703499489',
};

// Initialize Firebase using a singleton pattern to prevent re-initialization
function initializeFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export const app: FirebaseApp = initializeFirebaseApp();
