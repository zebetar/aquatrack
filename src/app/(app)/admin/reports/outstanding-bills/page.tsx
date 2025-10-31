
"use client";

import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types'; 
import { useState, useEffect, useCallback } from 'react';
import { Droplets, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getOutstandingCustomers, getAllUsageRecords } from '@/lib/firebase-service';
import { useToast } from '@/hooks/use-toast';

type CustomerWithUsage = Customer & { totalUsageHours?: number };

export default function OutstandingBillsPage() {
  const [outstandingCustomers, setOutstandingCustomers] = useState<CustomerWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchOutstandingCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
        const [customers, allUsageRecords] = await Promise.all([
          getOutstandingCustomers(),
          getAllUsageRecords()
        ]);
        
        const usageMap = new Map<string, number>();
        allUsageRecords.forEach(record => {
            usageMap.set(record.customerId, (usageMap.get(record.customerId) || 0) + record.durationHours);
        });

        const augmentedCustomers = customers.map(customer => ({
            ...customer,
            totalUsageHours: usageMap.get(customer.id) || 0,
        }));

        setOutstandingCustomers(augmentedCustomers);
    } catch (error) {
        console.error("Failed to fetch outstanding customers:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load outstanding customer data.' });
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
