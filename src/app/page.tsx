
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
        if (user) {
          router.replace(user.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard');
        } else {
          router.replace('/login');
        }
    }
  }, [user, loading, router]);

  // Show a loading splash screen while auth state is being determined.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 animated-login-bg">
        <Droplets className="h-24 w-24 text-sky-500 animate-pulse-subtle" />
    </div>
  );
}
