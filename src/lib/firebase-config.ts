
// src/lib/firebase-config.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, Timestamp } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validate that the required environment variables are set.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
`
********************************************************************************
*                                                                              *
*                      FIREBASE CONFIGURATION ERROR                            *
*                                                                              *
*      Firebase environment variables are not set.                             *
*      Please create a '.env.local' file in the root of your project and       *
*      add your Firebase project credentials from your Firebase Console.       *
*                                                                              *
*      Example .env.local:                                                     *
*      NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...                                  *
*      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com           *
*      NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id                         *
*      ...                                                                     *
*                                                                              *
*      The application will not function correctly until these are provided.   *
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
