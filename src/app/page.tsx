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

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="animate-splash-wrapper">
        <Droplets className="h-24 w-24 text-sky-500" />
      </div>
    </div>
  );
}
