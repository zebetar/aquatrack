
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { AddCustomerDialog } from '@/components/admin/customers/add-customer-dialog';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer, Notification, WaterUsageRecord } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { 
  getAllMockCustomers, 
  addMockCustomer as addCustomerToStore,
  addMockNotification,
  getAllMockUsageRecords 
} from '@/lib/mock-data-store';
import { Loader2 } from 'lucide-react';

type CustomerWithUsage = Customer & { totalUsageHours?: number };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100)); 
    const storedCustomers = getAllMockCustomers();
    const usageRecords = getAllMockUsageRecords();

    const customersWithUsage: CustomerWithUsage[] = storedCustomers.map(customer => {
      const customerUsage = usageRecords
        .filter(record => record.customerId === customer.id)
        .reduce((sum, record) => sum + record.durationHours, 0);
      return { ...customer, totalUsageHours: customerUsage };
    });
    setCustomers(customersWithUsage.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setIsLoading(false);
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

    fetchCustomers(); 
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
    <div className="mt-6">
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
      <div className="flex justify-center">
        <CustomerListTable 
          customers={customers} 
          onCustomerDeleted={() => { /* Deletion handled on User Management page or elsewhere */ }}
          deletingCustomerId={null} 
          enableActions={false}
          className="w-full max-w-6xl"
        />
      </div>
    </div>
  );
}
