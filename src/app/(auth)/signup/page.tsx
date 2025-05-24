
import { SignupForm } from '@/components/auth/signup-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <Card className="shadow-xl">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex items-center justify-center rounded-full bg-primary p-3 text-primary-foreground">
          <UserPlus className="h-10 w-10" />
        </div>
        <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
        <CardDescription>Sign up to get started with AquaTrack Mobile</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log In
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
