
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Droplets } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Give a moment for auth state to be confirmed
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          if (user.role === 'admin') {
            router.replace('/admin/dashboard');
          } else {
            router.replace('/viewer/dashboard');
          }
        } else {
          // If no user after loading, go to login
          router.replace('/login');
        }
      }, 500); // A shorter delay is fine now

      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  // Show a loading splash screen while auth state is being determined.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 animated-login-bg">
        <Droplets className="h-24 w-24 text-sky-500 animate-pulse-subtle" />
    </div>
  );
}
