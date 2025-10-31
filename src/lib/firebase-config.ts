
// src/lib/firebase-config.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, Timestamp } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id"
};

// Validate that the required environment variables are set.
if (firebaseConfig.apiKey === "your-api-key" || firebaseConfig.projectId === "your-project-id") {
  console.warn(
`
********************************************************************************
*                                                                              *
*                      FIREBASE CONFIGURATION WARNING                          *
*                                                                              *
*      Firebase environment variables are not set or are using placeholders.   *
*      Please create or check your '.env.local' file in the root of your       *
*      project and add your Firebase project credentials.                      *
*                                                                              *
*      The application will run in a mock mode, but will not connect to        *
*      a live Firebase backend until these are provided.                       *
*                                                                              *
********************************************************************************
`
  );
}


// Initialize Firebase
// This structure prevents re-initialization on hot reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app, Timestamp };
