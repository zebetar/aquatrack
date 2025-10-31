
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { User as AppUser } from '@/types';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User as FirebaseUser
} from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase-config';
import { getUserProfile, getCustomerByAuthUID, updateCustomerInDb, addUserProfile } from '@/lib/firebase-service';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        let profile = await getUserProfile(firebaseUser.uid);
        
        // This is the role-detection logic.
        const intendedRole = firebaseUser.email === 'admin@example.com' ? 'admin' : 'viewer';

        if (!profile || profile.role !== intendedRole) {
            console.log(`No profile found or role mismatch for UID ${firebaseUser.uid}. Creating/updating profile.`);
            
            const newUser: AppUser = {
                id: firebaseUser.uid,
                email: firebaseUser.email || 'no-email@example.com',
                role: intendedRole,
                name: firebaseUser.displayName || (profile?.name || (intendedRole === 'admin' ? 'Admin User' : 'New Viewer')),
                avatarUrl: profile?.avatarUrl
            };
            await addUserProfile(newUser);
            profile = newUser;
        }

        let finalUser: AppUser = {
            ...profile,
            id: firebaseUser.uid,
            email: firebaseUser.email || profile.email || '',
            name: firebaseUser.displayName || profile.name,
            role: intendedRole, // Explicitly set the role here to ensure it's correct
        };

         if (finalUser.role === 'viewer') {
            const customerProfile = await getCustomerByAuthUID(finalUser.id);
            if (customerProfile) {
                finalUser.customerId = customerProfile.id;
                // Only override name if it hasn't been set on the auth user profile yet
                if (!firebaseUser.displayName && !profile.name) {
                    finalUser.name = customerProfile.name;
                }
            }
        }

        setUser(finalUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


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
        description: error.code === 'auth/invalid-credential' 
            ? 'Invalid email or password. Please try again.' 
            : error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(firebaseAuth);
    toast({ title: "Logged Out" });
    router.push('/login');
  };
  
  const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    const firebaseUser = firebaseAuth.currentUser;
    if (!firebaseUser || !currentPassword || !firebaseUser.email) return { success: false, error: 'Not logged in or missing credentials.' };

    try {
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
        await updateEmail(firebaseUser, newEmail);
        
        if(user?.role === 'viewer' && user.customerId) {
            await updateCustomerInDb(user.customerId, { email: newEmail });
        } else if (user) { // This handles admin or any other user profile
            await addUserProfile({ ...user, email: newEmail });
        }

        toast({ title: 'Email Updated', description: 'Your email has been successfully updated.' });
        setUser(prevUser => prevUser ? {...prevUser, email: newEmail} : null);
        return { success: true };
    } catch (error: any) {
        console.error("Email update failed:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        return { success: false, error: error.message };
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
     const firebaseUser = firebaseAuth.currentUser;
     if (!firebaseUser || !firebaseUser.email) return { success: false, error: 'Not logged in.' };

     try {
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
        await updatePassword(firebaseUser, newPassword);
        toast({ title: "Password Updated!", description: "Your password has been changed successfully." });
        return { success: true };
     } catch (error: any) {
        console.error("Password update failed:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        return { success: false, error: error.message };
     }
  };
  
  const updateAdminName = async (newName: string) => {
    if(user && user.role === 'admin') {
      const trimmedName = newName.trim();
      await addUserProfile({ ...user, name: trimmedName });
      setUser(prev => prev ? {...prev, name: trimmedName } : null);
      toast({ title: "Admin Name Updated", description: `Your display name is now ${trimmedName}.` });
    }
  };
  
  const updateUserAvatarUrl = async (newUrl: string | null) => {
     if(user) {
      await addUserProfile({ ...user, avatarUrl: newUrl || undefined });
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
