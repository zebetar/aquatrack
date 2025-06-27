"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Droplets, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  // This splash screen mimics the login card for a seamless transition effect
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 animated-login-bg">
      <div className="w-full max-w-md">
        <Card className="shadow-xl glassmorphism-card animate-splash-pop w-full">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex items-center justify-center rounded-full bg-sky-500/10 p-3 text-sky-500">
              <Droplets className="h-10 w-10" />
            </div>
            <CardTitle className="text-4xl font-bold lowercase tracking-tighter text-sky-500 animate-shimmer">aquatrack</CardTitle>
          </CardHeader>
          <CardContent className="py-8 text-center">
             <div className="flex items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                <p>Loading your dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
