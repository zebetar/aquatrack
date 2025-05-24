
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { getAllMockCustomers } from '@/lib/mock-data-store';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OutstandingBillsPage() {
  const [outstandingCustomers, setOutstandingCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOutstandingCustomers = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const allCustomers = getAllMockCustomers();
      const filteredCustomers = allCustomers
        .filter(customer => customer.balance > 0)
        .sort((a, b) => b.balance - a.balance); // Sort by highest balance first
      setOutstandingCustomers(filteredCustomers);
      setIsLoading(false);
    }, 100);
  }, []);

  useEffect(() => {
    fetchOutstandingCustomers();
  }, [fetchOutstandingCustomers]);

  if (isLoading && outstandingCustomers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading customers with outstanding bills...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Customers with Outstanding Bills"
        description="List of customers who have a pending balance."
      />
      <Button variant="outline" asChild className="mb-6">
        <Link href="/admin/reports">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Link>
      </Button>

      {isLoading && outstandingCustomers.length > 0 && (
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Refreshing list...</span>
        </div>
      )}

      {outstandingCustomers.length > 0 ? (
        <CustomerListTable
          customers={outstandingCustomers}
          onCustomerDeleted={() => {
            // Deletion should ideally be handled on User Management or Customer Detail page
            // For now, we'll just re-fetch if this page were to support deletion directly
            fetchOutstandingCustomers(); 
          }}
          deletingCustomerId={null}
          enableActions={false} // No delete actions directly on this specific report view
        />
      ) : (
        !isLoading && (
          <div className="rounded-lg border bg-card p-6 text-center shadow-sm glassmorphism-card">
            <p className="text-muted-foreground">
              No customers currently have outstanding bills.
            </p>
          </div>
        )
      )}
    </>
  );
}
