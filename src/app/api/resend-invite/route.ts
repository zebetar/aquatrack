
// src/app/api/resend-invite/route.ts
import { NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin-config';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    // Initialize the Admin SDK
    initializeAdminApp();
    const adminAuth = getAuth();
    
    // Check if user exists, if not, create one
    let user;
    try {
        user = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            user = await adminAuth.createUser({ email });
        } else {
            throw error; // Re-throw other errors
        }
    }

    // Generate the password reset link using the Admin SDK
    const link = await adminAuth.generatePasswordResetLink(email);

    // In a real application, you would use an email service (e.g., SendGrid, Nodemailer)
    // to send this link to the user. For this project, we will log it to the console
    // to confirm that the entire flow is working correctly.
    console.log("------------------------------------------------------");
    console.log(`Password reset link for ${email}:`);
    console.log(link);
    console.log("------------------------------------------------------");
    console.log("In a real app, this link would be sent in an email.");


    return NextResponse.json({ success: true, message: "Password reset link generated and logged to the server console.", uid: user.uid });

  } catch (error: any) {
    console.error('Error in /api/resend-invite:', error);
    let errorMessage = 'An unexpected error occurred.';
    
    if (error.code === 'auth/invalid-email') {
      errorMessage = 'The email provided is not a valid email address.';
    } else if (error.code === 'auth/email-already-exists') {
       errorMessage = 'A user with this email already exists.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'No user found with this email address.';
    } else if (error.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
      errorMessage = "The server is not configured correctly. Please check the service account key environment variable."
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
