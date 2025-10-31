
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { User as AppUser, Customer } from '@/types';
import { authenticateUser, getCustomerByAuthUID } from '@/lib/firebase-service';

// Helper to manage user session in localStorage
const setSession = (user: AppUser | null) => {
  try {
    if (user) {
      localStorage.setItem('user-session', JSON.stringify(user));
    } else {
      localStorage.removeItem('user-session');
    }
  } catch (error) {
    console.error("Could not access localStorage.", error);
  }
};

const getSession = (): AppUser | null => {
  try {
    const sessionStr = localStorage.getItem('user-session');
    if (!sessionStr) return null;
    const sessionUser = JSON.parse(sessionStr);
    // Add logic here to check if session is expired if needed
    return sessionUser;
  } catch (error) {
    console.error("Could not access localStorage.", error);
    return null;
  }
};


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
  const { toast } = useToast();

  useEffect(() => {
    // On initial load, check for a persisted session
    const sessionUser = getSession();
    if (sessionUser) {
      setUser(sessionUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const authenticatedUser = await authenticateUser(email, password);
      if (authenticatedUser) {
        let finalUser = authenticatedUser;
        // For viewers, ensure their customerId is linked from the customers collection
        if (finalUser.role === 'viewer') {
            const customerProfile = await getCustomerByAuthUID(finalUser.id);
            if (customerProfile) {
                finalUser.customerId = customerProfile.id;
            }
        }
        
        setUser(finalUser);
        setSession(finalUser);

        toast({ title: "Login Successful" });
        // Redirect after successful login
        const redirectPath = finalUser.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard';
        router.push(redirectPath);
      } else {
        throw new Error("Invalid email or password.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
      });
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setSession(null);
    toast({ title: "Logged Out" });
    router.push('/login');
  };
  
  const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };
    // This is a mock implementation. In a real app, you'd re-authenticate.
    if (!currentPassword) {
      toast({variant: 'destructive', title: 'Password Required', description: 'Password is required to change email.'});
      return { success: false, error: 'Password required' };
    }
    // Mock password check
    if (currentPassword !== 'password') {
      toast({variant: 'destructive', title: 'Incorrect Password', description: 'The password you entered is incorrect.'});
      return { success: false, error: 'Incorrect password' };
    }
    
    const updatedUser = { ...user, email: newEmail };
    setUser(updatedUser);
    setSession(updatedUser);
    toast({ title: 'Email Updated', description: 'Your email has been successfully updated.' });
    return { success: true };
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
     if (!user) return { success: false, error: 'Not logged in' };
    // Mock password check
    if (currentPassword !== 'password') {
      toast({variant: 'destructive', title: 'Incorrect Password', description: 'The password you entered is incorrect.'});
      return { success: false, error: 'Incorrect password' };
    }
    toast({ title: "Password Updated!", description: "Your password has been changed successfully." });
    // In mock, we don't actually store the new password, just simulate success.
    return { success: true };
  };
  
  const updateAdminName = async (newName: string) => {
    if(user && user.role === 'admin') {
      const trimmedName = newName.trim();
      const updatedUser = { ...user, name: trimmedName };
      setUser(updatedUser);
      setSession(updatedUser);
      toast({ title: "Admin Name Updated", description: `Your display name is now ${trimmedName}.` });
    }
  };
  
  const updateUserAvatarUrl = async (newUrl: string | null) => {
     if(user) {
      const updatedUser = { ...user, avatarUrl: newUrl || undefined };
      setUser(updatedUser);
      setSession(updatedUser);
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
