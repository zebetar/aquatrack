
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { AddCustomerDialog } from '@/components/admin/customers/add-customer-dialog';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { 
  getAllMockCustomers, 
  addMockCustomer as addCustomerToStore,
  deleteMockCustomer as deleteCustomerFromStore, // This function will not be used here directly
  getMockCustomerById,
  getMockUsageRecordsByCustomerId,
  getMockPaymentsByCustomerId 
} from '@/lib/mock-data-store';
import { generateCustomerPdf } from '@/lib/generate-customer-pdf';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // deletingCustomerId state is no longer needed here as delete action is moved
  const { toast } = useToast();

  const fetchCustomers = useCallback(() => {
    setIsLoading(true);
    // Simulate a small delay
    setTimeout(() => {
      const storedCustomers = getAllMockCustomers();
      setCustomers(storedCustomers);
      setIsLoading(false);
    }, 100);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = (newCustomer: Customer) => {
    addCustomerToStore(newCustomer);
    fetchCustomers(); 
  };

  // handleCustomerDeleted is no longer needed on this page. 
  // It will be handled by AdminUsersPage.

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
        onCustomerDeleted={() => { /* Deletion handled on User Management page */ }}
        deletingCustomerId={null} // Not used on this page
        enableActions={false} // Hide actions column on this page
      />
    </>
  );
}
