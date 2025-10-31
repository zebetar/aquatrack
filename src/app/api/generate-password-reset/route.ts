'use server';
import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminApp } from '@/lib/firebase-admin-config';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
    }
    
    // Initialize the Admin App
    const adminApp = initializeAdminApp();
    const adminAuth = getAuth(adminApp);
    
    // Generate the password reset link
    const link = await adminAuth.generatePasswordResetLink(email);

    // IMPORTANT: Log the link to the console
    // In a real production app, you would email this link to the user.
    console.log(`\n--- PASSWORD RESET LINK ---
    For user: ${email}
    Link: ${link}
    --- END PASSWORD RESET LINK ---\n`);

    return NextResponse.json({ success: true, message: 'Password reset link generated in server console.' });

  } catch (error: any) {
    console.error('Error in generate-password-reset API:', error);

    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No user found with this email address.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
