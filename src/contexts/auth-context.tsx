"use client";

import type { User as AppUser } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth as firebaseAuth, db } from '@/lib/firebase-config';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserEmail: (newEmail: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateAdminName: (newName: string) => void;
  updateUserAvatarUrl: (newUrl: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const handleUserAuthChange = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const appUser = { uid: firebaseUser.uid, ...userSnap.data() } as AppUser;
        setUser(appUser);
        const targetPath = appUser.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard';
        router.replace(targetPath);
      } else {
        // This handles users created in Firebase Auth but without a 'users' doc yet.
        // It creates a basic profile for them.
        const newUser: AppUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          role: 'viewer', // Default role
          name: firebaseUser.displayName || 'New User',
        };
        await setDoc(userRef, newUser);
        setUser(newUser);
        router.replace('/viewer/dashboard');
      }
    } else {
      setUser(null);
      router.replace('/login');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, handleUserAuthChange);
    return () => unsubscribe();
  }, [handleUserAuthChange]);


  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      // onAuthStateChanged will handle setting user state and routing
      toast({ title: "Login Successful" });
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      let description = "An unknown error occurred.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Invalid email or password. Please try again.";
      }
      toast({ variant: "destructive", title: "Login Failed", description });
      setLoading(false); // Explicitly stop loading on error
    }
    // No need to setLoading(false) on success, as onAuthStateChanged will do it.
  };
  
  const logout = async () => {
    setLoading(true);
    await signOut(firebaseAuth);
    setUser(null);
    setLoading(false);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };

  const reauthenticate = async (password: string) => {
    const firebaseUser = firebaseAuth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      throw new Error("User not found or email is missing.");
    }
    const credential = EmailAuthProvider.credential(firebaseUser.email, password);
    await reauthenticateWithCredential(firebaseUser, credential);
  };

  const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    const firebaseUser = firebaseAuth.currentUser;
    if (!firebaseUser) return { success: false, error: 'User not logged in.' };
    if (!currentPassword) {
      toast({ variant: 'destructive', title: 'Password Required', description: 'Please enter your current password to change email.' });
      return { success: false, error: 'Password required.' };
    }

    try {
      await reauthenticate(currentPassword);
      await updateEmail(firebaseUser, newEmail);
      
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, { email: newEmail });

      setUser(prevUser => prevUser ? { ...prevUser, email: newEmail } : null);
      toast({ title: "Email Updated", description: `Your email is now ${newEmail}.` });
      return { success: true };
    } catch (error: any) {
      console.error("Update Email Error:", error);
      toast({ variant: 'destructive', title: 'Error Updating Email', description: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const firebaseUser = firebaseAuth.currentUser;
    if (!firebaseUser) return { success: false, error: 'User not logged in.' };

    try {
      await reauthenticate(currentPassword);
      await updatePassword(firebaseUser, newPassword);
      toast({ title: "Password Updated!", description: "Your password has been changed successfully." });
      return { success: true };
    } catch (error: any) {
      console.error("Update Password Error:", error);
      toast({ variant: 'destructive', title: 'Error Updating Password', description: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateAdminName = async (newName: string) => {
    if (user && user.role === 'admin') {
      const trimmedName = newName.trim();
      if (trimmedName) {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, { name: trimmedName });
        setUser(prev => prev ? { ...prev, name: trimmedName } : null);
        toast({ title: "Admin Name Updated", description: `Your display name is now ${trimmedName}.` });
      }
    }
  };
  
  const updateUserAvatarUrl = async (newAvatarUrl: string | null) => {
    if (user) {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { avatarUrl: newAvatarUrl || null });
      setUser(prev => prev ? { ...prev, avatarUrl: newAvatarUrl || undefined } : null);
      if (newAvatarUrl) {
        toast({ title: "Avatar Updated", description: "Your profile picture has been updated." });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserEmail, updateAdminName, updateUserAvatarUrl, updateUserPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
