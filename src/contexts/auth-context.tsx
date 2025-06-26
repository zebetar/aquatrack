
"use client";

import type { User, Customer } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getMockCustomerByEmail } from '@/lib/mock-data-store';
// Firebase imports are no longer needed for the mock flow but kept for easy re-integration
// import { auth as firebaseAuth, db } from '@/lib/firebase-config';
// import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
// import { collection, query, where, getDocs } from 'firebase/firestore';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: 'admin' | 'viewer') => Promise<void>;
  logout: () => void;
  updateUserEmail: (newEmail: string) => void;
  updateAdminName: (newName: string) => void;
  updateUserAvatarUrl: (newUrl: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_ADMIN_USER_BASE: Omit<User, 'id' | 'role' | 'avatarUrl'> = { email: 'admin@aquatrack.com', name: 'Admin User' };
export const MOCK_VIEWER_PASSWORD = "viewerpassword"; 

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // This effect now simulates session persistence using localStorage for mock auth.
    setLoading(true);
    try {
      const storedUserString = localStorage.getItem('authUser');
      if (storedUserString) {
        const storedUser = JSON.parse(storedUserString) as User;
        setUser(storedUser);
        // Redirect if a logged-in user tries to access the login page
        if (pathname.startsWith('/login')) {
          if (storedUser.role === 'admin') {
            router.replace('/admin/dashboard');
          } else {
            router.replace('/viewer/dashboard');
          }
        }
      } else {
         // If no stored user, and not on login page, redirect to login
         if (!pathname.startsWith('/login')) {
            router.replace('/login');
         }
      }
    } catch (error) {
      console.error("Error reading auth user from localStorage", error);
      localStorage.removeItem('authUser');
    }
    setLoading(false);
  }, [pathname, router]);

  const login = async (email: string, password: string, role: 'admin' | 'viewer'): Promise<void> => {
    setLoading(true);
    const processedEmail = email.trim().toLowerCase();

    // MOCK ADMIN LOGIN
    if (role === 'admin') {
      if (processedEmail === MOCK_ADMIN_USER_BASE.email.toLowerCase()) {
        const adminUser: User = {
          id: 'admin001',
          ...MOCK_ADMIN_USER_BASE,
          role: 'admin',
        };
        setUser(adminUser);
        localStorage.setItem('authUser', JSON.stringify(adminUser));
        toast({ title: "Admin Login Successful (Mock)" });
        router.push('/admin/dashboard');
      } else {
        toast({ variant: "destructive", title: "Invalid Admin Email", description: "The mock admin email is 'admin@aquatrack.com'." });
      }
      setLoading(false);
      return;
    }

    // MOCK VIEWER LOGIN
    if (role === 'viewer') {
      const customer = getMockCustomerByEmail(processedEmail);
      if (customer) {
        if (password === MOCK_VIEWER_PASSWORD) {
          const viewerUser: User = {
            id: customer.authUID || `auth-${customer.id}`,
            email: customer.email!,
            role: 'viewer',
            name: customer.name,
            customerId: customer.id,
          };
          setUser(viewerUser);
          localStorage.setItem('authUser', JSON.stringify(viewerUser));
          toast({ title: "Viewer Login Successful (Mock)" });
          router.push('/viewer/dashboard');
        } else {
          toast({ variant: "destructive", title: "Incorrect Password", description: `The mock password for all viewers is "${MOCK_VIEWER_PASSWORD}".` });
        }
      } else {
        toast({ variant: "destructive", title: "Viewer Not Found", description: `No customer with the email '${processedEmail}' exists in the mock data. Please add one via the Admin panel.` });
      }
    }
    setLoading(false);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('authUser');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  };

  const updateUserEmail = (newEmail: string) => { 
    if (user && user.role === 'viewer' && user.customerId) {
      const processedNewEmail = newEmail.trim().toLowerCase();
      const updatedUser = { ...user, email: processedNewEmail };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      // In a real app, you'd also call a function to update this in Firestore
      toast({ title: "Viewer Email Updated (App Level)", description: `Your app email reference is now ${processedNewEmail}.` });
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
  
  const updateUserAvatarUrl = (newAvatarUrl: string | null) => {
    if (user) {
      const updatedUser = { ...user, avatarUrl: newAvatarUrl || undefined };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      if (newAvatarUrl) {
        toast({ title: "Avatar Updated", description: "Your profile picture has been updated." });
      } else {
        toast({ title: "Avatar Removed", description: "Your profile picture has been removed." });
      }
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserEmail, updateAdminName, updateUserAvatarUrl }}>
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
