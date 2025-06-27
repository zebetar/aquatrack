
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Droplets } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // This delay allows the animation to be visible before navigating.
      const timer = setTimeout(() => {
        if (user) {
          if (user.role === 'admin') {
            router.replace('/admin/dashboard');
          } else {
            router.replace('/viewer/dashboard');
          }
        } else {
          router.replace('/login');
        }
      }, 1500); // This duration should match the animation duration in globals.css

      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  // This splash screen shows only the icon animating.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 animated-login-bg">
      <div className="animate-icon-pop">
        <Droplets className="h-24 w-24 text-sky-500" />
      </div>
    </div>
  );
}
