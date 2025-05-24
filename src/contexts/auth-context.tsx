
"use client";

import type { User, Customer } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAllMockCustomers, updateCustomerEmail as updateCustomerEmailInStore } from '@/lib/mock-data-store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: 'admin' | 'viewer') => Promise<void>;
  logout: () => void;
  updateUserEmail: (newEmail: string) => void;
  updateAdminName: (newName: string) => void; // Added for admin name change
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_ADMIN_USER: User = { id: 'admin001', email: 'admin@aquatrack.com', role: 'admin', name: 'Admin User' };
const MOCK_ADMIN_PASSWORD = "adminpassword";
export const MOCK_VIEWER_PASSWORD = "viewerpassword";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.role) {
          setUser(parsedUser);
        } else {
          console.warn("Stored user data is incomplete or invalid. Clearing.");
          localStorage.removeItem('authUser');
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const isAuthPage = pathname.startsWith('/login');

    if (!user) {
      if (!isAuthPage) {
        router.push('/login');
      }
    } else {
      if (isAuthPage) {
        router.push(user.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard');
      }
      if (user.role === 'admin' && pathname.startsWith('/viewer')) {
        router.push('/admin/dashboard');
      } else if (user.role === 'viewer' && pathname.startsWith('/admin')) {
        router.push('/viewer/dashboard');
      }
    }
  }, [user, loading, pathname, router]);


  const login = async (email: string, password: string, role: 'admin' | 'viewer'): Promise<void> => {
    setLoading(true);
    await delay(500);

    let loggedInUser: User | null = null;
    const processedEmail = email.trim().toLowerCase();

    if (role === 'admin' && processedEmail === MOCK_ADMIN_USER.email && password === MOCK_ADMIN_PASSWORD) {
      // Use a copy of MOCK_ADMIN_USER to allow for name changes in session
      loggedInUser = { ...MOCK_ADMIN_USER };
    } else if (role === 'viewer') {
      const customers = getAllMockCustomers();
      const foundCustomer = customers.find(
        (c: Customer) =>
          c.email?.trim().toLowerCase() === processedEmail &&
          c.authUID 
      );

      if (foundCustomer && password === MOCK_VIEWER_PASSWORD) {
        loggedInUser = {
          id: foundCustomer.authUID!,
          email: foundCustomer.email!,
          role: 'viewer',
          name: foundCustomer.name,
          customerId: foundCustomer.id,
        };
      }
    }

    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem('authUser', JSON.stringify(loggedInUser));
      toast({ title: "Login Successful", description: `Welcome back, ${loggedInUser.name || loggedInUser.email}!` });
    } else {
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid credentials or role mismatch." });
    }
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    router.push('/login');
  };

  const updateUserEmail = (newEmail: string) => {
    if (user && user.role === 'viewer' && user.customerId) {
      const processedNewEmail = newEmail.trim().toLowerCase();
      const updatedUser = { ...user, email: processedNewEmail };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      updateCustomerEmailInStore(user.customerId, processedNewEmail);
    }
  };

  const updateAdminName = (newName: string) => {
    if (user && user.role === 'admin') {
      const trimmedName = newName.trim();
      if (trimmedName) {
        const updatedUser = { ...user, name: trimmedName };
        setUser(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
        toast({ title: "Admin Name Updated", description: `Your display name is now ${trimmedName}.` });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Admin name cannot be empty." });
      }
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserEmail, updateAdminName }}>
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
