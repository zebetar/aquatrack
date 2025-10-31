
// src/app/api/resend-invite/route.ts
import { NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin-config';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAuth, db } from '@/lib/firebase-config';
import { sendPasswordResetEmail } from 'firebase/auth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }
    
    // We use the client-side SDK for this action as it's the simplest way
    // to trigger the pre-configured email template in Firebase.
    // This API route acts as a secure proxy to do so.
    await sendPasswordResetEmail(firebaseAuth, email);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error resending password reset:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email address.';
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
