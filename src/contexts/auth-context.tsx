
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { User as AppUser, Customer } from '@/types';
import { MOCK_USERS, MOCK_CUSTOMERS } from '@/lib/mock-data-store';

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
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate checking for a logged-in user from localStorage
    try {
      const storedUser = localStorage.getItem('loggedInUser');
      if (storedUser) {
        const parsedUser: AppUser = JSON.parse(storedUser);
        
        // Re-fetch customerId in case it changed
        if(parsedUser.role === 'viewer') {
            const customerProfile = MOCK_CUSTOMERS.find(c => c.authUID === parsedUser.id);
            if (customerProfile) {
                parsedUser.customerId = customerProfile.id;
            }
        }
        setUser(parsedUser);

      }
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      localStorage.removeItem('loggedInUser');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (foundUser) {
      const { password, ...userToStore } = foundUser;
      
      let customerId: string | undefined = undefined;
      if (userToStore.role === 'viewer') {
        const customerProfile = MOCK_CUSTOMERS.find(c => c.authUID === userToStore.id);
        if (customerProfile) {
          customerId = customerProfile.id;
        }
      }
      
      const finalUser = { ...userToStore, customerId };

      setUser(finalUser);
      localStorage.setItem('loggedInUser', JSON.stringify(finalUser));
      toast({ title: "Login Successful" });
      
      if (finalUser.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/viewer/dashboard');
      }

    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
    }
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(null);
    localStorage.removeItem('loggedInUser');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
    setLoading(false);
  };
  
  const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !currentPassword) return { success: false, error: "Not authenticated or password missing." };
    
    const currentUserInDb = MOCK_USERS.find(u => u.id === user.id);
    if (currentUserInDb?.password !== currentPassword) {
      toast({ variant: 'destructive', title: 'Authentication Failed', description: 'Incorrect password.' });
      return { success: false, error: 'Incorrect password.' };
    }

    // Update mock user
    currentUserInDb.email = newEmail;
    // Update local storage
    const updatedUser = { ...user, email: newEmail };
    setUser(updatedUser);
    localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
    
    toast({ title: 'Email Updated', description: 'Your email has been changed.' });
    return { success: true };
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not logged in.' };
    
    const currentUserInDb = MOCK_USERS.find(u => u.id === user.id);
    if (currentUserInDb?.password !== currentPassword) {
       toast({ variant: 'destructive', title: 'Authentication Failed', description: 'Incorrect current password.' });
      return { success: false, error: 'Incorrect current password.' };
    }
    
    currentUserInDb.password = newPassword;
    toast({ title: "Password Updated!", description: "Your password has been changed successfully." });
    return { success: true };
  };
  
  const updateAdminName = (newName: string) => {
    if(user && user.role === 'admin') {
      const trimmedName = newName.trim();
      const updatedUser = {...user, name: trimmedName};
      setUser(updatedUser);
      localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
      
      const userInDb = MOCK_USERS.find(u => u.id === user.id);
      if(userInDb) userInDb.name = trimmedName;

      toast({ title: "Admin Name Updated", description: `Your display name is now ${trimmedName}.` });
    }
  };
  
  const updateUserAvatarUrl = (newUrl: string | null) => {
     if(user) {
      const updatedUser = {...user, avatarUrl: newUrl || undefined};
      setUser(updatedUser);
      localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
      
      const userInDb = MOCK_USERS.find(u => u.id === user.id);
      if(userInDb) userInDb.avatarUrl = newUrl || undefined;

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
