
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { User as AppUser, Customer } from '@/types';
import { MOCK_USERS, MOCK_CUSTOMERS } from '@/lib/mock-data-store';
import { getCustomerByAuthUID } from '@/lib/firebase-service'; // Still used for profile linking

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

  const loadUserFromStorage = useCallback(async () => {
    setLoading(true);
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      const parsedUser: AppUser = JSON.parse(storedUser);
      // If user is a viewer, ensure their customerId is linked from the latest data
      if (parsedUser.role === 'viewer') {
          const customerProfile = await getCustomerByAuthUID(parsedUser.id);
          if (customerProfile) {
              parsedUser.customerId = customerProfile.id;
          }
      }
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    await new Promise(res => setTimeout(res, 500)); // Simulate network delay

    const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);

    if (foundUser) {
      const appUser: AppUser = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        name: foundUser.name,
        customerId: foundUser.customerId,
      };

      // If viewer, fetch full customer profile to get latest ID
      if (appUser.role === 'viewer') {
        const customerProfile = await getCustomerByAuthUID(appUser.id);
        if(customerProfile){
          appUser.customerId = customerProfile.id;
        } else {
           toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not find a customer profile linked to this account.",
          });
          setLoading(false);
          return;
        }
      }

      setUser(appUser);
      localStorage.setItem('authUser', JSON.stringify(appUser));
      
      toast({ title: "Login Successful" });

      if (appUser.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/viewer/dashboard');
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
    await new Promise(res => setTimeout(res, 200));
    setUser(null);
    localStorage.removeItem('authUser');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
    setLoading(false);
  };
  
  const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !currentPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not logged in or password missing.' });
      return { success: false, error: 'User not logged in or password missing.' };
    }
    const mockUser = MOCK_USERS.find(u => u.id === user.id);
    if (mockUser && mockUser.password === currentPassword) {
        mockUser.email = newEmail;
        const updatedUser = { ...user, email: newEmail };
        setUser(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        toast({ title: 'Email Updated', description: 'Your email has been changed (mock).' });
        return { success: true };
    }
    toast({ variant: 'destructive', title: 'Update Failed', description: 'Incorrect password.' });
    return { success: false, error: 'Incorrect password.' };
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not logged in.' });
      return { success: false, error: 'User not logged in.' };
    }
    const mockUser = MOCK_USERS.find(u => u.id === user.id);
    if (mockUser && mockUser.password === currentPassword) {
        mockUser.password = newPassword;
        toast({ title: "Password Updated!", description: "Your password has been changed successfully (mock)." });
        return { success: true };
    }
    toast({ variant: 'destructive', title: 'Update Failed', description: 'Incorrect password.' });
    return { success: false, error: 'Incorrect password.' };
  };
  
  const updateAdminName = async (newName: string) => {
    if(user && user.role === 'admin') {
      const trimmedName = newName.trim();
      const mockUser = MOCK_USERS.find(u => u.id === user.id);
      if(mockUser) mockUser.name = trimmedName;

      const updatedUser = { ...user, name: trimmedName };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));

      toast({ title: "Admin Name Updated", description: `Your display name is now ${trimmedName}.` });
    }
  };
  
  const updateUserAvatarUrl = async (newUrl: string | null) => {
     if(user) {
      const mockUser = MOCK_USERS.find(u => u.id === user.id);
      if(mockUser) mockUser.avatarUrl = newUrl || undefined;

      const updatedUser = {...user, avatarUrl: newUrl || undefined};
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
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
