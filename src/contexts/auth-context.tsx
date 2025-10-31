
"use client";

import type { User, Customer } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth as firebaseAuth, db } from '@/lib/firebase-config';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: 'admin' | 'viewer') => Promise<void>;
  logout: () => void;
  updateUserEmail: (newEmail: string, currentPassword?: string) => Promise<{ success: boolean, error?: string }>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean, error?: string }>;
  updateAdminName: (newName: string) => void;
  updateUserAvatarUrl: (newUrl: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MOCK_VIEWER_PASSWORD = "password"; 

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleUserAuthChange = useCallback(async (firebaseUser: import('firebase/auth').User | null) => {
    if (firebaseUser) {
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const role = idTokenResult.claims.role as 'admin' | 'viewer' || 'viewer'; // Default to viewer
        
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        let appUser: User | null = null;
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            appUser = {
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                name: userData.name,
                role: role,
                avatarUrl: userData.avatarUrl || undefined,
                customerId: userData.customerId || undefined,
            };
        }
        
        setUser(appUser);
        localStorage.setItem('authUser', JSON.stringify(appUser));
    } else {
        setUser(null);
        localStorage.removeItem('authUser');
        if (!['/login', '/'].includes(pathname)) {
            router.push('/login');
        }
    }
    setLoading(false);
  }, [router, pathname]);


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
      console.error("Firebase login error:", error);
      let description = "An unknown error occurred.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          description = "Invalid email or password. Please try again.";
      } else if (error.code === 'auth/invalid-api-key') {
          description = "Firebase API Key is invalid. Please check your configuration.";
      }
      toast({ variant: "destructive", title: "Login Failed", description });
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    await signOut(firebaseAuth);
    // onAuthStateChanged will handle cleanup
    toast({ title: "Logged Out" });
    router.push('/login');
  };

 const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ success: boolean, error?: string }> => {
    const firebaseUser = firebaseAuth.currentUser;
    if (!firebaseUser || !currentPassword) {
      return { success: false, error: "User not authenticated or password not provided." };
    }
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email!, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updateEmail(firebaseUser, newEmail);
      // Also update the user document in Firestore if necessary (handled in firebase-service)
      if (user) {
        const updatedUser = { ...user, email: newEmail };
        setUser(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
      toast({ title: "Email Updated", description: "Your email has been successfully updated." });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating email:", error);
      const message = error.code === 'auth/wrong-password' ? 'Incorrect current password.' : 'Failed to update email.';
      toast({ variant: 'destructive', title: 'Error', description: message });
      return { success: false, error: message };
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean, error?: string }> => {
    const firebaseUser = firebaseAuth.currentUser;
    if (!firebaseUser) {
      return { success: false, error: "User not authenticated." };
    }
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email!, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      toast({ title: "Password Updated", description: "Your password has been successfully updated." });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating password:", error);
      const message = error.code === 'auth/wrong-password' ? 'Incorrect current password.' : 'Failed to update password.';
      toast({ variant: 'destructive', title: 'Error', description: message });
      return { success: false, error: message };
    }
  };


  const updateAdminName = (newName: string) => {
    // This is a mock implementation as admin details are not in a 'users' collection by default
    if (user && user.role === 'admin') {
      const trimmedName = newName.trim();
      if (trimmedName) {
        const updatedUser = { ...user, name: trimmedName };
        setUser(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        toast({ title: "Admin Name Updated", description: `Your display name is now ${trimmedName}.` });
      }
    }
  };
  
  const updateUserAvatarUrl = (newAvatarUrl: string | null) => {
    // This is a mock implementation
    if (user) {
      const updatedUser = { ...user, avatarUrl: newAvatarUrl || undefined };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      if (newAvatarUrl) {
        toast({ title: "Avatar Updated", description: "Your profile picture has been updated." });
      }
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, login: (email, pass, role) => login(email, pass), logout, updateUserEmail, updateAdminName, updateUserAvatarUrl, updateUserPassword }}>
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
