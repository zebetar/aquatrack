import admin from 'firebase-admin';

// This function is intended to be used in a secure server environment (e.g., Next.js API Routes)
export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Check if the service account key is available in environment variables
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('Firebase Admin SDK Error: The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error("Firebase Admin SDK Initialization Error: ", error.message);
    throw new Error('Firebase Admin SDK Error: Could not initialize. Please check the service account key environment variable.');
  }
}
