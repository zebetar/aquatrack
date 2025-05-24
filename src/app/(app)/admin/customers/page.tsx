
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { AddCustomerDialog } from '@/components/admin/customers/add-customer-dialog';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types';
import { useState, useEffect } from 'react';

// Placeholder data fetching function - now returning empty array for initial load
async function getInitialCustomers(): Promise<Customer[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return []; // Return empty array to clear data
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      setIsLoading(true);
      const initialCustomers = await getInitialCustomers();
      setCustomers(initialCustomers);
      setIsLoading(false);
    }
    loadCustomers();
  }, []);

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers(prevCustomers => [...prevCustomers, newCustomer]);
  };

  if (isLoading) {
    // Optional: Add a loading state indicator if desired
    // return <p>Loading customers...</p>; 
  }

  return (
    <>
      <PageHeader 
        title="Customer Management" 
        description="View, add, and manage customer details."
        actions={<AddCustomerDialog onCustomerAdded={handleAddCustomer} />}
      />
      <CustomerListTable customers={customers} />
    </>
  );
}
