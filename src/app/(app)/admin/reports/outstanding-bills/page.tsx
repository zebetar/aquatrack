
"use client";

import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types'; 
import { useState, useEffect, useCallback } from 'react';
import { getMockOutstandingCustomers, getAllMockUsageRecords } from '@/lib/mock-data-store'; 
import { Droplets, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type CustomerWithUsage = Customer & { totalUsageHours?: number };

export default function OutstandingBillsPage() {
  const [outstandingCustomers, setOutstandingCustomers] = useState<CustomerWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchOutstandingCustomers = useCallback(() => {
    setIsLoading(true);
    try {
        const customers = getMockOutstandingCustomers();
        const usageRecords = getAllMockUsageRecords();
        
        const augmentedCustomers = customers.map(customer => {
            const customerUsage = usageRecords
                .filter(record => record.customerId === customer.id)
                .reduce((sum, record) => sum + record.durationHours, 0);
            return { ...customer, totalUsageHours: customerUsage };
        });

        setOutstandingCustomers(augmentedCustomers);
    } catch (error) {
        console.error("Failed to fetch outstanding customers from mock store:", error);
        toast({
          variant: "destructive",
          title: "Failed to load report",
          description: "Could not retrieve outstanding bills report. Check console for details.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOutstandingCustomers();
  }, [fetchOutstandingCustomers]);

  if (isLoading && outstandingCustomers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Droplets className="h-8 w-8 animate-pulse-subtle text-primary" />
        <p className="ml-2">Loading customers with outstanding bills...</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/admin/reports">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>Back to Reports</span>
        </Link>
      </Button>

      {isLoading && outstandingCustomers.length > 0 && (
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />
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
          <div className="rounded-lg border bg-card p-6 text-center shadow-sm glassmorphism-card max-w-md mx-auto">
            <p className="text-muted-foreground">
              No customers currently have outstanding bills.
            </p>
          </div>
        )
      )}
    </div>
  );
}
