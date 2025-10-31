
"use client";

import type { User, Customer } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getMockCustomerByEmail, updateCustomerEmail as updateMockCustomerEmail } from '@/lib/mock-data-store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserEmail: (newEmail: string, currentPassword?: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateAdminName: (newName: string) => void;
  updateUserAvatarUrl: (newUrl: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is a mock password. In a real app, you'd use Firebase Auth.
export const MOCK_ADMIN_PASSWORD = "password"; 
export const MOCK_VIEWER_PASSWORD = "password"; 

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);

        // Determine target path based on user role
        const targetPath = parsedUser.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard';

        // Redirect if not on a login-related page and not on the correct dashboard
        if (!['/login', '/'].includes(pathname) && !pathname.startsWith(`/${parsedUser.role}`)) {
            router.replace(targetPath);
        }
      }
    } catch (error) {
      console.error("Failed to parse auth user from localStorage", error);
      localStorage.removeItem('authUser');
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);


  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const processedEmail = email.trim().toLowerCase();

    if (processedEmail === 'admin@example.com' && password === MOCK_ADMIN_PASSWORD) {
      const adminUser: User = {
        id: 'admin001',
        email: processedEmail,
        name: 'Administrator',
        role: 'admin',
      };
      setUser(adminUser);
      localStorage.setItem('authUser', JSON.stringify(adminUser));
      toast({ title: "Login Successful", description: "Welcome back, Admin!" });
      router.replace('/admin/dashboard');
    } else {
        const customerProfile: Customer | null = getMockCustomerByEmail(processedEmail);
        if (customerProfile && password === MOCK_VIEWER_PASSWORD) {
            const viewerUser: User = {
                id: customerProfile.authUID || `user-${customerProfile.id}`,
                email: processedEmail,
                name: customerProfile.name,
                role: 'viewer',
                customerId: customerProfile.id,
            };
            setUser(viewerUser);
            localStorage.setItem('authUser', JSON.stringify(viewerUser));
            toast({ title: "Login Successful", description: `Welcome, ${customerProfile.name}!` });
            router.replace('/viewer/dashboard');
        } else {
            toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password." });
        }
    }
    setLoading(false);
  };
  
  const logout = async () => {
    setUser(null);
    localStorage.removeItem('authUser');
    await new Promise(resolve => setTimeout(resolve, 200)); // Short delay for effect
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };

  const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !user.customerId) return { success: false, error: 'Not a viewer account.' };
    // In mock mode, we don't need the password, but we check its presence to match the function signature
    if (!currentPassword) {
      toast({ variant: 'destructive', title: 'Password Required', description: 'Please enter your current password to change email.' });
      return { success: false, error: 'Password required.' };
    }
    
    updateMockCustomerEmail(user.customerId, newEmail);
    const updatedUser = { ...user, email: newEmail };
    setUser(updatedUser);
    localStorage.setItem('authUser', JSON.stringify(updatedUser));
    toast({ title: "Email Updated", description: `Your email is now ${newEmail}.` });
    return { success: true };
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not logged in.' };
    // This is a mock. In a real app, this would be a secure Firebase operation.
    if (user.role === 'admin' && currentPassword !== MOCK_ADMIN_PASSWORD) {
      toast({ variant: 'destructive', title: 'Error', description: 'Incorrect current password for admin.' });
      return { success: false, error: 'Incorrect password.' };
    }
    if (user.role === 'viewer' && currentPassword !== MOCK_VIEWER_PASSWORD) {
      toast({ variant: 'destructive', title: 'Error', description: 'Incorrect current password.' });
      return { success: false, error: 'Incorrect password.' };
    }

    // In a real app, you would now update the password in Firebase Auth.
    // Here, we just show a success message.
    toast({ title: "Password Updated!", description: "Your password has been changed." });
    return { success: true };
  };


  const updateAdminName = (newName: string) => {
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
