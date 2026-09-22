import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

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

// Send Password Reset Email via Firebase
export const sendFirebasePasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return {
      success: true,
      message: `Password reset email has been sent to ${email}. Please check your inbox and spam folder.`,
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    console.warn("Firebase password reset error:", error);
    if (error.code === 'auth/user-not-found') {
      return { success: false, message: 'No registered account found with this email in Firebase.' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, message: 'Invalid email address provided.' };
    }
    return { success: false, message: error.message || 'Failed to send password reset email.' };
  }
};

// Sign In with Firebase Email and Password
export const signInFirebaseUser = async (email: string, pass: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return { success: true, user: userCredential.user };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    return { success: false, error: error.code || error.message || 'Authentication failed' };
  }
};

// Fetch User Profile and Role from Firestore
export const fetchFirestoreUserProfile = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    console.warn('Firestore fetch user profile error:', err);
    return null;
  }
};

// Save / Update User Profile in Firestore
export const saveFirestoreUserProfile = async (uid: string, data: Record<string, any>) => {
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore save user profile error:', err);
    return false;
  }
};

