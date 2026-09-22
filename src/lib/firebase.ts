import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDqDf3Ae_JuH8b9IMwz-pJsh_EKB7hza9Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "xeeroo-store.firebaseapp.com",
  databaseURL: "https://xeeroo-store-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "xeeroo-store",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "xeeroo-store.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "751882362566",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:751882362566:web:27bdc54b01d2683a8281c7",
  measurementId: "G-0VY2GNZYR9",
};

// Initialize Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
