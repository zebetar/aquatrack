
import admin from 'firebase-admin';

export function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }

    try {
        const credentials = JSON.parse(serviceAccountKey);
        return admin.initializeApp({
            credential: admin.credential.cert(credentials),
        });
    } catch(e) {
        console.error("Failed to parse Firebase service account key. Make sure it's a valid JSON string.", e);
        throw new Error("Invalid Firebase service account key.");
    }
}
