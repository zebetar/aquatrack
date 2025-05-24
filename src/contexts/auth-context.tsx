
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
    // Load user from localStorage on initial mount
    setLoading(true); // Start loading
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.role) {
          setUser(parsedUser);
        } else {
          // Invalid user object, clear it
          localStorage.removeItem('authUser');
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false); // Done loading
  }, []);

  useEffect(() => {
    if (loading) { // Only run redirect logic after initial loading is complete
      return; 
    }

    const isAuthPage = pathname.startsWith('/login'); 

    if (!user) { 
      // If no user is logged in and not on an auth page, redirect to login
      if (!isAuthPage) {
        router.push('/login');
      }
    } else { 
      // If user is logged in and on an auth page, redirect to their dashboard
      if (isAuthPage) {
        router.push(user.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard');
      }
      // Additional check: if user is on a page not matching their role, redirect
      // Example: admin on /viewer/* or viewer on /admin/*
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
    const processedLoginEmail = email.trim().toLowerCase();

    if (role === 'admin' && processedLoginEmail === MOCK_ADMIN_USER.email.toLowerCase() && password === MOCK_ADMIN_PASSWORD) {
      loggedInUser = MOCK_ADMIN_USER;
    } else if (role === 'viewer') {
      const customers = getAllMockCustomers(); // Ensure this gets fresh data
      const foundCustomer = customers.find(
        (c: Customer) => 
          c.email?.trim().toLowerCase() === processedLoginEmail && // Compare processed emails
          c.authUID // Ensure customer has an authUID (is eligible for login)
      );

      if (foundCustomer && password === MOCK_VIEWER_PASSWORD) {
        loggedInUser = {
          id: foundCustomer.authUID!, 
          email: foundCustomer.email!, // Use the original stored email for the user object
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
      // Redirect will be handled by the useEffect hook based on user state change
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
    // This function updates email for a logged-in VIEWER
    if (user && user.role === 'viewer' && user.customerId) {
      const processedNewEmail = newEmail.trim().toLowerCase();
      const updatedUser = { ...user, email: processedNewEmail };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      // Also update in the mock-data-store if this user is a customer
      updateCustomerEmailInStore(user.customerId, processedNewEmail);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserEmail }}>
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
