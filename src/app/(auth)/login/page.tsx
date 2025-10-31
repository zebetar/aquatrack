
"use client";

import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react'; 
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
        router.replace(user.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard');
    }
  }, [user, loading, router]);


  if(loading || user) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Droplets className="h-12 w-12 animate-pulse-subtle text-primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-xl glassmorphism-card w-full">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex items-center justify-center rounded-full bg-sky-500/10 p-3 text-sky-500">
          <Droplets className="h-10 w-10" />
        </div>
        <CardTitle className="text-4xl font-bold lowercase tracking-tighter text-sky-500 animate-shimmer">aquatrack</CardTitle>
      </CardHeader>
      <CardContent className="py-8">
        <LoginForm />
      </CardContent>
    </Card>
  );
}
