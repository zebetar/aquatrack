
"use client";

import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer, WaterUsageRecord } from '@/types'; 
import { useState, useEffect, useCallback } from 'react';
import { getAllMockCustomers, getAllMockUsageRecords } from '@/lib/mock-data-store'; 
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type CustomerWithUsage = Customer & { totalUsageHours?: number };

export default function OutstandingBillsPage() {
  const [outstandingCustomers, setOutstandingCustomers] = useState<CustomerWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOutstandingCustomers = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const allCustomers = getAllMockCustomers();
      const usageRecords = getAllMockUsageRecords(); 

      const augmentedCustomers = allCustomers.map(customer => {
        const customerUsage = usageRecords
          .filter(record => record.customerId === customer.id)
          .reduce((sum, record) => sum + record.durationHours, 0);
        return { ...customer, totalUsageHours: customerUsage };
      });
      
      const filteredCustomers = augmentedCustomers
        .filter(customer => customer.balance > 0)
        .sort((a, b) => b.balance - a.balance); 
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
    <div className="mt-6">
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
            fetchOutstandingCustomers(); 
          }}
          deletingCustomerId={null}
          enableActions={false} 
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
    </div>
  );
}
