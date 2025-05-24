
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { AddCustomerDialog } from '@/components/admin/customers/add-customer-dialog';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer, Notification } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { 
  getAllMockCustomers, 
  addMockCustomer as addCustomerToStore,
  addMockNotification
} from '@/lib/mock-data-store';
import { Loader2 } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchCustomers = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const storedCustomers = getAllMockCustomers();
      setCustomers(storedCustomers.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setIsLoading(false);
    }, 100);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = (newCustomer: Customer) => {
    addCustomerToStore(newCustomer);
    
    const adminNotification: Notification = {
        id: `noti-${Date.now()}-admin-newcust`,
        userId: 'admin001', 
        message: `New customer added: ${newCustomer.name}.`,
        type: 'CUSTOMER_ADDED',
        isRead: false,
        linkTo: `/admin/customers/${newCustomer.id}`,
        createdAt: new Date(),
    };
    addMockNotification(adminNotification);

    fetchCustomers(); // Re-fetch the list from the store to update the UI
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
        // Removed description "View, add, and manage customer details."
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
        deletingCustomerId={null} 
        enableActions={false} // Actions (like delete) are not on this page
      />
    </>
  );
}
