"use client";

import type { User } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, role: 'admin' | 'viewer') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users
const MOCK_ADMIN_USER: User = { id: 'admin001', email: 'admin@aquatrack.com', role: 'admin', name: 'Admin User' };
const MOCK_VIEWER_USER: User = { id: 'viewer001', email: 'viewer@aquatrack.com', role: 'viewer', name: 'Customer User', customerId: 'cust001' };


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Simulate checking for an existing session
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/login')) {
      router.push('/login');
    } else if (!loading && user && pathname.startsWith('/login')) {
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard');
    }
  }, [user, loading, pathname, router]);


  const login = (email: string, role: 'admin' | 'viewer') => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      let loggedInUser: User | null = null;
      if (role === 'admin' && email.toLowerCase() === MOCK_ADMIN_USER.email.toLowerCase()) {
        loggedInUser = MOCK_ADMIN_USER;
      } else if (role === 'viewer' && email.toLowerCase() === MOCK_VIEWER_USER.email.toLowerCase()) {
        loggedInUser = MOCK_VIEWER_USER;
      }
      
      if (loggedInUser) {
        setUser(loggedInUser);
        localStorage.setItem('authUser', JSON.stringify(loggedInUser));
        router.push(loggedInUser.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard');
      } else {
        // Handle login failure (e.g., show toast)
        alert('Invalid credentials or role mismatch for mock login.');
      }
      setLoading(false);
    }, 500);
  };

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
