
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { User as AppUser, Customer } from '@/types';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseAuth, db } from '@/lib/firebase-config';

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

async function getAppUser(firebaseUser: any): Promise<AppUser | null> {
  const userDocRef = doc(db, "users", firebaseUser.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    
    // Check if viewer and link customerId
    if (userData.role === 'viewer') {
      const customerDocRef = doc(db, "customers", userData.customerId);
      const customerDoc = await getDoc(customerDocRef);
      if (customerDoc.exists()) {
         return { ...userData, id: firebaseUser.uid } as AppUser;
      }
    }
    return { ...userData, id: firebaseUser.uid } as AppUser;
  } else {
    // If no user doc, but user is authenticated (e.g. just created in console)
    // create a basic profile and proceed.
    const isFirstAdmin = firebaseUser.email === 'admin@example.com';
    const basicProfile: AppUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      role: isFirstAdmin ? 'admin' : 'viewer',
      name: firebaseUser.displayName || firebaseUser.email!,
    };
    // Save this basic profile back to Firestore
    await setDoc(userDocRef, { email: basicProfile.email, role: basicProfile.role, name: basicProfile.name });
    return basicProfile;
  }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const handleUserAuthChange = useCallback(async (firebaseUser: any | null) => {
    if (firebaseUser) {
      const appUser = await getAppUser(firebaseUser);
      setUser(appUser);
      
      if (appUser?.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
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
      console.error("Firebase Auth Error:", error.code, error.message);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
      setLoading(false); // Ensure loading is stopped on error
    }
    // Loading state is set to false in onAuthStateChanged
  };

  const logout = async () => {
    setLoading(true);
    await signOut(firebaseAuth);
    setUser(null);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
    setLoading(false);
  };
  
  const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuth.currentUser || !currentPassword) return { success: false, error: "Not authenticated or password missing." };
    
    const credential = EmailAuthProvider.credential(firebaseAuth.currentUser.email!, currentPassword);
    
    try {
      await reauthenticateWithCredential(firebaseAuth.currentUser, credential);
      await updateEmail(firebaseAuth.currentUser, newEmail);
      
      const userDocRef = doc(db, "users", firebaseAuth.currentUser.uid);
      await setDoc(userDocRef, { email: newEmail }, { merge: true });
      
      setUser(prev => prev ? { ...prev, email: newEmail } : null);
      
      toast({ title: 'Email Updated', description: 'Your email has been changed.' });
      return { success: true };

    } catch (error: any) {
      console.error("Update Email Error:", error);
      toast({ variant: 'destructive', title: 'Email Update Failed', description: error.message || 'Please check your password and try again.' });
      return { success: false, error: error.message };
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuth.currentUser) return { success: false, error: 'User not logged in.' };
    
    const credential = EmailAuthProvider.credential(firebaseAuth.currentUser.email!, currentPassword);
    
    try {
      await reauthenticateWithCredential(firebaseAuth.currentUser, credential);
      await updatePassword(firebaseAuth.currentUser, newPassword);
      toast({ title: "Password Updated!", description: "Your password has been changed successfully." });
      return { success: true };

    } catch(error: any) {
      console.error("Update Password Error:", error);
      toast({ variant: 'destructive', title: 'Password Change Failed', description: error.message || 'Could not update password.' });
      return { success: false, error: error.message };
    }
  };
  
  const updateAdminName = async (newName: string) => {
    if(user && firebaseAuth.currentUser && user.role === 'admin') {
      const trimmedName = newName.trim();
      const userDocRef = doc(db, "users", user.id);
      await setDoc(userDocRef, { name: trimmedName }, { merge: true });
      setUser(prev => prev ? { ...prev, name: trimmedName } : null);
      toast({ title: "Admin Name Updated", description: `Your display name is now ${trimmedName}.` });
    }
  };
  
  const updateUserAvatarUrl = async (newUrl: string | null) => {
     if(user && firebaseAuth.currentUser) {
      const updatedUser = {...user, avatarUrl: newUrl || undefined};
      const userDocRef = doc(db, "users", user.id);
      await setDoc(userDocRef, { avatarUrl: newUrl || null }, { merge: true });
      setUser(updatedUser);
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
