
"use client";

import type { User, Customer } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { 
  updateCustomerEmail as updateCustomerEmailInStore 
} from '@/lib/mock-data-store';
import { auth as firebaseAuth, db } from '@/lib/firebase-config';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';


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
export const MOCK_VIEWER_PASSWORD = "viewerpassword"; // Exported for use in forms if needed

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase Auth. Now fetch their app-specific profile.
        const storedUserString = localStorage.getItem('authUser');
        let appUserRole: 'admin' | 'viewer' | null = null;
        let appUserName: string | undefined;
        let appUserAvatarUrl: string | undefined;

        if (storedUserString) {
          try {
            const storedAppUser = JSON.parse(storedUserString);
            if (storedAppUser.id === firebaseUser.uid) { // Check if stored user matches current Firebase user
              appUserRole = storedAppUser.role;
              appUserName = storedAppUser.name;
              appUserAvatarUrl = storedAppUser.avatarUrl;
            } else {
              localStorage.removeItem('authUser'); // Clear stale data
            }
          } catch (e) {
            console.error("AuthProvider (onAuthStateChanged): Error parsing 'authUser' from localStorage", e);
            localStorage.removeItem('authUser'); // Clear corrupted data
          }
        }
        
        if (firebaseUser.email === MOCK_ADMIN_USER_BASE.email) {
          const adminUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'admin',
            name: appUserName || MOCK_ADMIN_USER_BASE.name, // Use stored name if available
            avatarUrl: appUserAvatarUrl,
          };
          setUser(adminUser);
          localStorage.setItem('authUser', JSON.stringify(adminUser)); // Re-save potentially updated admin info
          if (pathname.startsWith('/login') || !pathname.startsWith('/admin')) {
             router.push('/admin/dashboard');
          }
        } else {
          try {
            const customersRef = collection(db, "customers");
            const q = query(customersRef, where("authUID", "==", firebaseUser.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              if (querySnapshot.size > 1) {
                console.warn(`AuthProvider: Multiple customer profiles found for authUID ${firebaseUser.uid}. Using the first one.`);
              }
              const customerDoc = querySnapshot.docs[0];
              const customerData = customerDoc.data() as Customer;

              if (customerData.email && customerData.email.toLowerCase() === firebaseUser.email?.toLowerCase()) {
                const viewerUser: User = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email!,
                  role: 'viewer',
                  name: customerData.name,
                  customerId: customerDoc.id,
                  avatarUrl: appUserAvatarUrl, 
                };
                setUser(viewerUser);
                localStorage.setItem('authUser', JSON.stringify(viewerUser));
                if (pathname.startsWith('/login') || !pathname.startsWith('/viewer')) {
                   router.push('/viewer/dashboard');
                }
              } else {
                 console.error(`AuthProvider: VIEWER PROFILE EMAIL MISMATCH. Firestore email: ${customerData.email}, Auth email: ${firebaseUser.email}.`);
                toast({
                  variant: "destructive",
                  title: `Profile Email Mismatch`,
                  description: `Authenticated as ${firebaseUser.email}, but the linked customer profile email does not match. Logging out.`,
                  duration: 9000,
                });
                await signOut(firebaseAuth);
              }
            } else {
              console.error(`AuthProvider: VIEWER PROFILE NOT FOUND for authUID: ${firebaseUser.uid}`);
              toast({
                variant: "destructive",
                title: `Profile Loading Error`,
                description: `Authentication was successful, but no customer profile was found linked to your account. Please contact support. You have been logged out.`,
                duration: 9000,
              });
              await signOut(firebaseAuth);
            }
          } catch (error) {
            console.error(`AuthProvider: Error during query for customer profile:`, error);
            const firebaseError = error as { code?: string; message?: string };
            toast({
              variant: "destructive",
              title: `Profile Loading Error: ${firebaseError.code || 'Query Failed'}`,
              description: `${firebaseError.message || 'Could not load your customer profile due to a database error.'} This may be due to missing Firestore security rules or a missing index. You have been logged out.`,
              duration: 9000,
            });
            await signOut(firebaseAuth);
          }
        }
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem('authUser');
        if (!pathname.startsWith('/login')) {
           router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname, toast]);

  const login = async (email: string, password: string, formSelectedRole: 'admin' | 'viewer'): Promise<void> => {
    const processedEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      // Attempt Firebase sign-in. onAuthStateChanged will handle profile linking.
      await signInWithEmailAndPassword(firebaseAuth, processedEmail, password);
    } catch (error: any) {
      console.error("AuthProvider (login): Firebase signInWithEmailAndPassword error:", error);
      let title = "Login Failed";
      let description = "An unexpected error occurred during login.";

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        title = "Invalid Credentials";
        description = "The email or password does not match a valid user. Please go to your Firebase Authentication console, verify the user exists, is enabled, and reset their password if needed.";
      } else if (error.code === 'auth/too-many-requests') {
        title = "Too Many Attempts";
        description = "Access to this account has been temporarily disabled due to many failed login attempts. You can restore it by resetting your password or you can try again later.";
      } else if (error.code === 'auth/api-key-not-valid') {
          title = 'Invalid Firebase API Key';
          description = 'The API key in your Firebase config is invalid. Please check your .env.local file and ensure it matches the config in your Firebase project settings.';
      }
      
      toast({ 
        variant: "destructive", 
        title: title, 
        description: description,
        duration: 9000 // Give user more time to read the instructions
      });
      setUser(null); // Ensure user state is cleared
      localStorage.removeItem('authUser');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(firebaseAuth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      console.error("AuthProvider (logout): Error during sign out:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log you out." });
    } finally {
      setLoading(false);
    }
  };

  const updateUserEmail = (newEmail: string) => { // For Viewer
    if (user && user.role === 'viewer' && user.customerId) {
      const processedNewEmail = newEmail.trim().toLowerCase();
      const updatedUser = { ...user, email: processedNewEmail };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      updateCustomerEmailInStore(user.customerId, processedNewEmail);
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
