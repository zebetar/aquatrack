"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function ViewerProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <p>Not authenticated.</p>;
  }

  return (
    <>
      <PageHeader title="My Profile" description="View and manage your account details." />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your personal and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={user.name || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user.email} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer ID</Label>
            <Input id="customerId" defaultValue={user.customerId || 'N/A'} readOnly />
          </div>
          {/* In a real app, add forms for password change, etc. */}
          <Button disabled>Update Profile (Not Implemented)</Button>
        </CardContent>
      </Card>
    </>
  );
}
