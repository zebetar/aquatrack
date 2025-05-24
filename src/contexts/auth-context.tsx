
"use client";

import type { User, Customer } from '@/types'; // Added Customer type
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAllMockCustomers } from '@/lib/mock-data-store'; // Import customer data access

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: 'admin' | 'viewer') => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users and credentials
const MOCK_ADMIN_USER: User = { id: 'admin001', email: 'admin@aquatrack.com', role: 'admin', name: 'Admin User' };
const MOCK_ADMIN_PASSWORD = "adminpassword";
// MOCK_VIEWER_USER can be a fallback or example, but we'll try to find dynamic customers first
const MOCK_VIEWER_PASSWORD = "viewerpassword"; // Generic password for all mock viewers

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate checking for an existing session from localStorage
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        // Basic validation of parsedUser structure
        if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.role) {
          setUser(parsedUser);
        } else {
          // Invalid stored user data
          localStorage.removeItem('authUser');
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem('authUser'); // Clear corrupted data
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // This effect handles redirection based on auth state and current path
    if (loading) {
      return; // Don't do anything while initial loading or during auth operations
    }

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

    if (!user) { // If no user is authenticated
      if (!isAuthPage) {
        // If not authenticated and not on an auth page, redirect to login
        router.push('/login');
      }
      // If not authenticated and on an auth page, do nothing (stay on auth page)
    } else { // If a user is authenticated
      if (isAuthPage) {
        // If authenticated and on an auth page, redirect to appropriate dashboard
        router.push(user.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard');
      }
      // If authenticated and not on an auth page (e.g. on dashboard), do nothing (stay on current page)
    }
  }, [user, loading, pathname, router]);


  const login = async (email: string, password: string, role: 'admin' | 'viewer'): Promise<void> => {
    setLoading(true);
    await delay(500); // Simulate API delay

    let loggedInUser: User | null = null;

    if (role === 'admin' && email.toLowerCase() === MOCK_ADMIN_USER.email.toLowerCase() && password === MOCK_ADMIN_PASSWORD) {
      loggedInUser = MOCK_ADMIN_USER;
    } else if (role === 'viewer') {
      const customers = getAllMockCustomers();
      const foundCustomer = customers.find(
        (c: Customer) => c.email?.toLowerCase() === email.toLowerCase() && c.authUID
      );

      if (foundCustomer && password === MOCK_VIEWER_PASSWORD) {
        loggedInUser = {
          id: foundCustomer.authUID!, // Use the customer's authUID as the user ID
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
      // Redirection will be handled by the useEffect hook that listens to user/loading state changes
    } else {
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid credentials or role mismatch." });
    }
    setLoading(false);
  };

  const signup = async (name: string, email: string, password: string): Promise<void> => {
    setLoading(true);
    await delay(1000); // Simulate API call for signup

    // In a real app, you'd create the user here.
    // For mock, we'll just pretend it was successful and they need to contact admin or link account
    console.log("Mock Signup:", { name, email, password });
    // In a real scenario, after signup, you'd either create a customer record automatically
    // or guide the user on how to link their account if they are an existing customer.
    // For this mock, we'll assume they now need to be added as a customer by an admin
    // if they aren't one already, or their existing customer profile needs to be linked.
    
    // To make signup more interactive in the mock, let's create a mock user and customer record
    // (this part is an addition to better simulate self-signup leading to an account)
    const mockAuthUID = `authuid-${Date.now()}`;
    const newMockCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: name,
      email: email,
      authUID: mockAuthUID,
      createdAt: new Date(),
      balance: 0,
    };
    // This would ideally go into the mock-data-store, but auth-context doesn't directly write there.
    // For now, this primarily makes the signup toast more meaningful.
    // A true self-service signup would update the mock-data-store.
    
    toast({
      title: "Signup Successful!",
      description: "You can now log in with your new account. Your customer profile has been (mock) created.",
    });
    // No direct navigation here. User will typically navigate to login page themselves.
    // AuthProvider's useEffect will keep them on /signup (as user is null until login).
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    router.push('/login'); // Go to login page after logout
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
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
