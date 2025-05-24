
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { AddCustomerDialog } from '@/components/admin/customers/add-customer-dialog';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { 
  getAllMockCustomers, 
  addMockCustomer as addCustomerToStore,
  deleteMockCustomer as deleteCustomerFromStore 
} from '@/lib/mock-data-store';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCustomers = useCallback(() => {
    setIsLoading(true);
    const storedCustomers = getAllMockCustomers();
    setCustomers(storedCustomers);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = (newCustomer: Customer) => {
    addCustomerToStore(newCustomer);
    fetchCustomers(); // Re-fetch from store to update list
  };

  const handleCustomerDeleted = async (customerId: string) => {
    setDeletingCustomerId(customerId);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    const customerToDelete = customers.find(c => c.id === customerId);
    deleteCustomerFromStore(customerId);
    fetchCustomers(); // Re-fetch from store
    setDeletingCustomerId(null);
    toast({
      title: "Customer Deleted",
      description: `${customerToDelete?.name || 'Customer'} and all associated data have been removed.`,
    });
  };

  if (isLoading && customers.length === 0) { 
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
        actions={<AddCustomerDialog onCustomerAdded={handleAddCustomer} />}
      />
      {isLoading && customers.length > 0 && ( 
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Refreshing customer list...</span>
        </div>
      )}
      <CustomerListTable 
        customers={customers} 
        onCustomerDeleted={handleCustomerDeleted}
        deletingCustomerId={deletingCustomerId}
      />
    </>
  );
}
