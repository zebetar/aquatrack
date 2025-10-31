import admin from 'firebase-admin';

// This function is intended to be used in a secure server environment (e.g., Next.js API Routes)
export function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        // In a real production app, you'd want to handle this more gracefully.
        // For this project, we'll log an error and throw to stop execution.
        console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
        throw new Error('Firebase Admin SDK credentials are not set. This is required for server-side operations.');
    }

    try {
        const credentials = JSON.parse(serviceAccountKey);
        return admin.initializeApp({
            credential: admin.credential.cert(credentials),
        });
    } catch (e) {
        console.error("Failed to parse Firebase service account key. Ensure it's a valid JSON string.", e);
        throw new Error("Invalid Firebase service account key format.");
    }
}
