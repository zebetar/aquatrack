"use client";

import type { User as AppUser, Customer } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getMockCustomerByEmail, updateCustomerEmail } from '@/lib/mock-data-store';

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

// --- Mock Users ---
const MOCK_USERS: { [email: string]: AppUser } = {
  'admin@example.com': {
    id: 'admin001',
    email: 'admin@example.com',
    role: 'admin',
    name: 'Admin User',
  },
  'viewer@example.com': {
    id: 'auth-001',
    email: 'viewer@example.com',
    role: 'viewer',
    name: 'Alice Johnson',
    customerId: 'cust-001'
  },
};

const MOCK_PASSWORDS: { [email: string]: string } = {
  'admin@example.com': 'password',
  'viewer@example.com': 'password',
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate checking for a logged-in user in localStorage
    const savedUserEmail = localStorage.getItem('loggedInUser');
    if (savedUserEmail && MOCK_USERS[savedUserEmail]) {
      setUser(MOCK_USERS[savedUserEmail]);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    const mockUser = MOCK_USERS[email];
    const mockPassword = MOCK_PASSWORDS[email];

    if (mockUser && mockPassword === password) {
      setUser(mockUser);
      localStorage.setItem('loggedInUser', email);
      toast({ title: "Login Successful" });
      const targetPath = mockUser.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard';
      router.replace(targetPath);
    } else {
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password." });
    }
    setLoading(false);
  };
  
  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(null);
    localStorage.removeItem('loggedInUser');
    setLoading(false);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };

  const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !currentPassword) {
      const msg = "User or password not provided.";
      toast({ variant: 'destructive', title: 'Error', description: msg });
      return { success: false, error: msg };
    }
    if (MOCK_PASSWORDS[user.email] !== currentPassword) {
      const msg = "The password you entered is incorrect.";
      toast({ variant: 'destructive', title: 'Authentication Failed', description: msg });
      return { success: false, error: msg };
    }
    if (MOCK_USERS[newEmail]) {
      const msg = "This email address is already in use.";
      toast({ variant: 'destructive', title: 'Error', description: msg });
      return { success: false, error: msg };
    }

    // Update mock data
    const oldEmail = user.email;
    const updatedUser = { ...user, email: newEmail };
    
    // Update MOCK_USERS
    delete MOCK_USERS[oldEmail];
    MOCK_USERS[newEmail] = updatedUser;

    // Update MOCK_PASSWORDS
    const pass = MOCK_PASSWORDS[oldEmail];
    delete MOCK_PASSWORDS[oldEmail];
    MOCK_PASSWORDS[newEmail] = pass;

    // Update customer record if it's a viewer
    if (user.role === 'viewer' && user.customerId) {
        updateCustomerEmail(user.customerId, newEmail);
    }
    
    setUser(updatedUser);
    localStorage.setItem('loggedInUser', newEmail);
    toast({ title: "Email Updated", description: `Your email is now ${newEmail}.` });
    return { success: true };
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not logged in.' };

    if (MOCK_PASSWORDS[user.email] !== currentPassword) {
      const msg = "Your current password does not match.";
      toast({ variant: 'destructive', title: 'Error Updating Password', description: msg });
      return { success: false, error: msg };
    }

    MOCK_PASSWORDS[user.email] = newPassword;
    toast({ title: "Password Updated!", description: "Your password has been changed successfully." });
    return { success: true };
  };

  const updateAdminName = (newName: string) => {
    if (user && user.role === 'admin') {
      const trimmedName = newName.trim();
      if (trimmedName) {
        const updatedUser = { ...user, name: trimmedName };
        MOCK_USERS[user.email] = updatedUser;
        setUser(updatedUser);
        toast({ title: "Admin Name Updated", description: `Your display name is now ${trimmedName}.` });
      }
    }
  };
  
  const updateUserAvatarUrl = (newAvatarUrl: string | null) => {
    if (user) {
      const updatedUser = { ...user, avatarUrl: newAvatarUrl || undefined };
      MOCK_USERS[user.email] = updatedUser;
      setUser(updatedUser);
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
