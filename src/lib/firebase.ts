import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "placeholder",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

// Initialize once; SSR pages using Firebase must be "use client"
const app =
  typeof window !== "undefined"
    ? getApps().length
      ? getApp()
      : initializeApp(firebaseConfig)
    : null;

// These are always accessed inside "use client" components — safe to cast
export const auth = app ? getAuth(app) : (null as never);
export const db = app ? getFirestore(app) : (null as never);
export const storage = app ? getStorage(app) : (null as never);
export const googleProvider = new GoogleAuthProvider();
