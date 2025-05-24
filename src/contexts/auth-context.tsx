
"use client";

import type { User, Customer } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAllMockCustomers } from '@/lib/mock-data-store'; 

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: 'admin' | 'viewer') => Promise<void>;
  logout: () => void;
  // Removed signup function from type
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users and credentials
const MOCK_ADMIN_USER: User = { id: 'admin001', email: 'admin@aquatrack.com', role: 'admin', name: 'Admin User' };
const MOCK_ADMIN_PASSWORD = "adminpassword";
const MOCK_VIEWER_PASSWORD = "viewerpassword"; // Generic password for all mock viewers

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.role) {
          setUser(parsedUser);
        } else {
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

    const isAuthPage = pathname.startsWith('/login'); // Only login page is auth page now

    if (!user) { 
      if (!isAuthPage) {
        router.push('/login');
      }
    } else { 
      if (isAuthPage) {
        router.push(user.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard');
      }
    }
  }, [user, loading, pathname, router]);


  const login = async (email: string, password: string, role: 'admin' | 'viewer'): Promise<void> => {
    setLoading(true);
    await delay(500); 

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

  // Removed signup function
  // async function signup(name: string, email: string, password: string): Promise<void> { ... }

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    router.push('/login'); 
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
