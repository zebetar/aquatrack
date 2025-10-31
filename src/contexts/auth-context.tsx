
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword as firebaseUpdatePassword, updateEmail as firebaseUpdateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseAuth, db } from '@/lib/firebase-config';
import type { User as AppUser, Customer } from '@/types';
import { getCustomerByAuthUID } from '@/lib/firebase-service';

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

async function fetchAppUser(firebaseUser: FirebaseUser): Promise<AppUser | null> {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        let customerId: string | undefined = undefined;

        if (userData.role === 'viewer') {
            const customerProfile = await getCustomerByAuthUID(firebaseUser.uid);
            if (customerProfile) {
                customerId = customerProfile.id;
            }
        }
        
        return {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: userData.role || 'viewer',
            name: userData.name || firebaseUser.displayName,
            customerId: customerId,
            avatarUrl: userData.avatarUrl || firebaseUser.photoURL,
        };
    } else {
        // If no user profile exists, create a default one for a basic login
        console.warn(`No user document found for UID ${firebaseUser.uid}. Creating a default profile.`);
        const defaultUserData: AppUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            role: 'viewer', // Default to viewer
            name: firebaseUser.displayName || 'New User'
        };
        await setDoc(userDocRef, { 
            email: defaultUserData.email,
            name: defaultUserData.name,
            role: defaultUserData.role
        });
        return defaultUserData;
    }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleUserAuthChange = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const appUser = await fetchAppUser(firebaseUser);
      setUser(appUser);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

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
      console.error("Login Error:", error);
      let description = "An unexpected error occurred.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          description = "Invalid email or password. Please try again.";
      }
      toast({ variant: "destructive", title: "Login Failed", description });
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    setLoading(true);
    try {
        await signOut(firebaseAuth);
        setUser(null);
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        router.push('/login');
    } catch (error) {
        console.error("Logout error:", error);
        toast({ variant: "destructive", title: "Logout Failed" });
    } finally {
        setLoading(false);
    }
  };

  const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuth.currentUser || !currentPassword) {
      const msg = "User not authenticated or password not provided.";
      toast({ variant: 'destructive', title: 'Error', description: msg });
      return { success: false, error: msg };
    }

    try {
        const credential = EmailAuthProvider.credential(firebaseAuth.currentUser.email!, currentPassword);
        await reauthenticateWithCredential(firebaseAuth.currentUser, credential);
        await firebaseUpdateEmail(firebaseAuth.currentUser, newEmail);
        
        // Update user doc in Firestore
        const userDocRef = doc(db, "users", firebaseAuth.currentUser.uid);
        await setDoc(userDocRef, { email: newEmail }, { merge: true });

        // Update customer doc if viewer
        if(user?.role === 'viewer' && user.customerId) {
            const customerDocRef = doc(db, "customers", user.customerId);
            await setDoc(customerDocRef, { email: newEmail }, { merge: true });
        }

        toast({ title: "Email Updated", description: `Your email is now ${newEmail}. Please log in again.` });
        await logout();
        return { success: true };

    } catch (error: any) {
        console.error("Email update error:", error);
        let message = "An error occurred while updating your email.";
        if (error.code === 'auth/invalid-credential') {
            message = "The password you entered is incorrect.";
        } else if (error.code === 'auth/email-already-in-use') {
            message = "This email is already in use by another account.";
        }
        toast({ variant: "destructive", title: "Update Failed", description: message });
        return { success: false, error: message };
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuth.currentUser) return { success: false, error: 'User not logged in.' };

    try {
        const credential = EmailAuthProvider.credential(firebaseAuth.currentUser.email!, currentPassword);
        await reauthenticateWithCredential(firebaseAuth.currentUser, credential);
        await firebaseUpdatePassword(firebaseAuth.currentUser, newPassword);
        toast({ title: "Password Updated!", description: "Your password has been changed successfully." });
        return { success: true };
    } catch (error: any) {
        console.error("Password update error:", error);
        let message = "An error occurred while updating your password.";
        if (error.code === 'auth/invalid-credential') {
            message = "Your current password does not match.";
        }
        toast({ variant: "destructive", title: "Error Updating Password", description: message });
        return { success: false, error: message };
    }
  };

  const updateAdminName = async (newName: string) => {
    if (user && user.id) {
      const trimmedName = newName.trim();
      if (trimmedName) {
        const userDocRef = doc(db, "users", user.id);
        try {
            await setDoc(userDocRef, { name: trimmedName }, { merge: true });
            setUser(prev => prev ? { ...prev, name: trimmedName } : null);
            toast({ title: "Admin Name Updated", description: `Your display name is now ${trimmedName}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update your name." });
        }
      }
    }
  };
  
  const updateUserAvatarUrl = async (newAvatarUrl: string | null) => {
    if (user && user.id) {
        const userDocRef = doc(db, "users", user.id);
        try {
            await setDoc(userDocRef, { avatarUrl: newAvatarUrl || null }, { merge: true });
            setUser(prev => prev ? { ...prev, avatarUrl: newAvatarUrl || undefined } : null);
            toast({ title: "Avatar Updated", description: "Your profile picture has been updated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not update your avatar." });
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
