
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types';
import { AddCustomerDialog } from '@/components/admin/customers/add-customer-dialog';

// Placeholder data fetching function - now returning empty array
async function getCustomers(): Promise<Customer[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return []; // Return empty array to clear data
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <>
      <PageHeader 
        title="Customer Management" 
        description="View, add, and manage customer details."
        actions={<AddCustomerDialog />}
      />
      <CustomerListTable customers={customers} />
    </>
  );
}
