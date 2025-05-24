
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { AddCustomerDialog } from '@/components/admin/customers/add-customer-dialog';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types';
import { useState, useEffect } from 'react';
import { getAllMockCustomers, addMockCustomer as addCustomerToStore } from '@/lib/mock-data-store';
import { Loader2 } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load customers from our mock store on initial mount
    setIsLoading(true);
    const storedCustomers = getAllMockCustomers();
    setCustomers(storedCustomers);
    setIsLoading(false);
  }, []);

  const handleAddCustomer = (newCustomer: Customer) => {
    // Add to the mock store
    addCustomerToStore(newCustomer);
    // Update local state by re-fetching from the store to ensure it's fresh
    setCustomers(getAllMockCustomers());
  };

  if (isLoading && customers.length === 0) { // Show loading only if there are no customers yet
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading customers...</p>
        </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Customer Management" 
        description="View, add, and manage customer details."
        actions={<AddCustomerDialog onCustomerAdded={handleAddCustomer} />}
      />
      {isLoading && customers.length > 0 && ( // Show subtle loading indicator if refreshing list
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Refreshing customer list...</span>
        </div>
      )}
      <CustomerListTable customers={customers} />
    </>
  );
}

