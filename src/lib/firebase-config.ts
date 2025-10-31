
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const firebaseAuth = getAuth(app);
const db = getFirestore(app);

// NOTE: The emulators are not used in this configuration.
// If you want to use the local Firebase emulators, uncomment the following lines.
// if (process.env.NODE_ENV === 'development') {
//   try {
//     console.log("Connecting to Firebase Emulators");
//     connectAuthEmulator(firebaseAuth, "http://127.0.0.1:9099", { disableWarnings: true });
//     connectFirestoreEmulator(db, "127.0.0.1", 8080);
//   } catch (error) {
//     console.error("Error connecting to Firebase emulators:", error);
//   }
// }

export { app, firebaseAuth, db };
