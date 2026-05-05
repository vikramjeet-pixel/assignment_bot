import { getApps, initializeApp, cert, getApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Lazy singleton — only initializes when first called, not at module load time.
// This prevents Next.js build failures when env vars are absent during static rendering.
let _db: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (_db) return _db;

  const existing = getApps().find((a) => a.name === "admin");
  const app =
    existing ??
    initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      },
      "admin"
    );

  _db = getFirestore(app ?? getApp("admin"));
  return _db;
}
