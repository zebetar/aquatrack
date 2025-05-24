
"use client";

import type { User } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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
const MOCK_VIEWER_USER: User = { id: 'viewer001', email: 'viewer@aquatrack.com', role: 'viewer', name: 'Customer User', customerId: 'cust001' };
const MOCK_VIEWER_PASSWORD = "viewerpassword";


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate checking for an existing session
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
      router.push('/login');
    } else if (!loading && user && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard');
    }
  }, [user, loading, pathname, router]);


  const login = async (email: string, password: string, role: 'admin' | 'viewer'): Promise<void> => {
    setLoading(true);
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        let loggedInUser: User | null = null;
        if (role === 'admin' && email.toLowerCase() === MOCK_ADMIN_USER.email.toLowerCase() && password === MOCK_ADMIN_PASSWORD) {
          loggedInUser = MOCK_ADMIN_USER;
        } else if (role === 'viewer' && email.toLowerCase() === MOCK_VIEWER_USER.email.toLowerCase() && password === MOCK_VIEWER_PASSWORD) {
          loggedInUser = MOCK_VIEWER_USER;
        }
        
        if (loggedInUser) {
          setUser(loggedInUser);
          localStorage.setItem('authUser', JSON.stringify(loggedInUser));
          toast({ title: "Login Successful", description: `Welcome back, ${loggedInUser.name}!` });
          router.push(loggedInUser.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard');
        } else {
          toast({ variant: "destructive", title: "Login Failed", description: "Invalid credentials or role mismatch." });
        }
        setLoading(false);
        resolve();
      }, 500);
    });
  };

  const signup = async (name: string, email: string, password: string): Promise<void> => {
    setLoading(true);
    // Simulate API call for signup
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real app, you'd create the user here.
        // For mock, we'll just pretend it was successful.
        console.log("Mock Signup:", { name, email, password });
        toast({
          title: "Signup Successful!",
          description: "You can now log in with your new account.",
        });
        // Typically, you'd redirect to login or auto-login the user.
        // For this mock, we'll redirect to login.
        router.push('/login');
        setLoading(false);
        resolve();
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    router.push('/login');
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
