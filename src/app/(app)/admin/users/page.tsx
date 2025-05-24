
"use client";

// This file can be deleted as the User Management feature has been removed.
// Keeping it empty for now to avoid breaking references if any exist,
// but ideally, it should be removed from the file system.

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader 
        title="User Management Removed" 
        description="This feature has been removed from the application."
      />
      <p className="text-muted-foreground">
        User management functionality is no longer available.
      </p>
      <Button asChild className="mt-4">
        <Link href="/admin/dashboard">Back to Dashboard</Link>
      </Button>
    </>
  );
}
