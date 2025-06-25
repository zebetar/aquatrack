
// src/lib/firebase-config.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, Timestamp } from 'firebase/firestore'; // Added Timestamp
import { getAuth } from 'firebase/auth';

// IMPORTANT: Replace these with your project's actual Firebase configuration
// You can find this in your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyBs9DNqE25-9ry3vfd3pxy1StehvVHmDCc",
  authDomain: "aquatrack-bhqjo.firebaseapp.com",
  projectId: "aquatrack-bhqjo",
  storageBucket: "aquatrack-bhqjo.firebasestorage.app",
  messagingSenderId: "215713489272",
  appId: "1:215713489272:web:72e2b6c5547adf25cba88d"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app); // If you plan to use Firebase Authentication

export { db, auth, app, Timestamp }; // Export Timestamp
