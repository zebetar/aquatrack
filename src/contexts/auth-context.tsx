
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { User as AppUser, Customer } from '@/types';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseAuth } from '@/lib/firebase-config';
import { getCustomerByAuthUID, updateCustomerInDb } from '@/lib/firebase-service';


interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserEmail: (newEmail: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateAdminName: (newName: string) => Promise<void>;
  updateUserAvatarUrl: (newUrl: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function getUserProfile(userId: string): Promise<AppUser | null> {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? (userDoc.data() as AppUser) : null;
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const handleUserAuthChange = useCallback(async (firebaseUser: import('firebase/auth').User | null) => {
    if (firebaseUser) {
        let appUser = await getUserProfile(firebaseUser.uid);
        
        if (!appUser) {
            // User exists in Auth, but not in Firestore 'users' collection.
            // Let's create a basic profile for them.
            const newUser: AppUser = {
                id: firebaseUser.uid,
                email: firebaseUser.email || 'no-email@example.com',
                role: 'viewer', // Default to viewer
                name: firebaseUser.displayName || 'New User',
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            appUser = newUser;
        }

        // For viewers, ensure their customerId is linked from the customers collection
        if (appUser.role === 'viewer') {
            const customerProfile = await getCustomerByAuthUID(appUser.id);
            if (customerProfile) {
                appUser.customerId = customerProfile.id;
            }
        }
        
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
      console.error("Firebase Auth Error:", error.code, error.message);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
        await signOut(firebaseAuth);
        setUser(null);
        toast({ title: "Logged Out" });
        router.push('/login');
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Logout Failed", description: error.message });
    } finally {
        setLoading(false);
    }
  };
  
  const reauthenticate = async (password: string) => {
    const firebaseUser = firebaseAuth.currentUser;
    if (!firebaseUser || !firebaseUser.email) throw new Error("User not found or email is missing.");
    const credential = EmailAuthProvider.credential(firebaseUser.email, password);
    await reauthenticateWithCredential(firebaseUser, credential);
    return firebaseUser;
  }

  const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
     if (!currentPassword) {
        toast({ variant: 'destructive', title: 'Password Required', description: 'Your current password is required to change your email.' });
        return { success: false, error: 'Password required' };
    }
    try {
        const firebaseUser = await reauthenticate(currentPassword);
        await updateEmail(firebaseUser, newEmail);
        
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, { email: newEmail }, { merge: true });

        setUser(prevUser => prevUser ? { ...prevUser, email: newEmail } : null);
        toast({ title: 'Email Updated', description: 'Your email has been successfully updated.' });
        return { success: true };
    } catch (error: any) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Email Update Failed', description: error.message });
        return { success: false, error: error.message };
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const firebaseUser = await reauthenticate(currentPassword);
        await updatePassword(firebaseUser, newPassword);
        toast({ title: "Password Updated!", description: "Your password has been changed successfully." });
        return { success: true };
    } catch (error: any) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Password Update Failed', description: error.message });
        return { success: false, error: error.message };
    }
  };
  
  const updateAdminName = async (newName: string) => {
    if(user && user.role === 'admin') {
      const trimmedName = newName.trim();
      const userDocRef = doc(db, 'users', user.id);
      await setDoc(userDocRef, { name: trimmedName }, { merge: true });
      setUser(prev => prev ? {...prev, name: trimmedName} : null);
      toast({ title: "Admin Name Updated", description: `Your display name is now ${trimmedName}.` });
    }
  };
  
  const updateUserAvatarUrl = async (newUrl: string | null) => {
     if(user) {
      const userDocRef = doc(db, 'users', user.id);
      await setDoc(userDocRef, { avatarUrl: newUrl || null }, { merge: true });
      setUser(prev => prev ? {...prev, avatarUrl: newUrl || undefined} : null);
      toast({ title: "Avatar Updated", description: "Your profile picture has been updated." });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserEmail, updateUserPassword, updateAdminName, updateUserAvatarUrl }}>
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
