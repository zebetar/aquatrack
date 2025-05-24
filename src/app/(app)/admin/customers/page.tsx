import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types';
import { AddCustomerDialog } from '@/components/admin/customers/add-customer-dialog';

// Placeholder data fetching function (replace with actual data fetching)
async function getCustomers(): Promise<Customer[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { id: 'cust001', name: 'Aarav Sharma', contactInfo: '9876543210', createdAt: new Date('2023-01-15'), balance: 1200, authUID: 'viewer001' },
    { id: 'cust002', name: 'Priya Patel', contactInfo: '9876543211', createdAt: new Date('2023-02-20'), balance: 2400 },
    { id: 'cust003', name: 'Rohan Mehta', contactInfo: '9876543212', createdAt: new Date('2023-03-10'), balance: 0 },
    { id: 'cust004', name: 'Sneha Reddy', contactInfo: '9876543213', createdAt: new Date('2023-04-05'), balance: -600 }, // Negative balance means credit
  ];
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
