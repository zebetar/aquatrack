
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { AddCustomerDialog } from '@/components/admin/customers/add-customer-dialog';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer, Notification, WaterUsageRecord } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { 
  getAllCustomersFromFirestore, 
  addCustomerToFirestore,
  addMockNotification,
  getAllMockUsageRecords 
} from '@/lib/mock-data-store';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CustomerWithUsage = Customer & { totalUsageHours?: number };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedCustomers = await getAllCustomersFromFirestore();
      const usageRecords = getAllMockUsageRecords();

      const customersWithUsage: CustomerWithUsage[] = storedCustomers.map(customer => {
        const customerUsage = usageRecords
          .filter(record => record.customerId === customer.id)
          .reduce((sum, record) => sum + record.durationHours, 0);
        return { ...customer, totalUsageHours: customerUsage };
      });
      setCustomers(customersWithUsage);
    } catch (error) {
        console.error("Failed to fetch customers from Firestore:", error);
        toast({
          variant: "destructive",
          title: "Failed to load customers",
          description: "Could not retrieve customer data from the database. Check console for details.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = async (newCustomer: Customer) => {
    try {
      await addCustomerToFirestore(newCustomer);
      
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
    } catch (error) {
        console.error("Failed to add customer to Firestore:", error);
        toast({
          variant: "destructive",
          title: "Failed to add customer",
          description: "Could not save new customer to the database. Please try again.",
        });
    }
  };

  if (isLoading && customers.length === 0) { 
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading customers from database...</p>
        </div>
    );
  }

  return (
    <div className="mt-6">
      <PageHeader 
        title="Customer Management" 
        description="Live data from Firestore"
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
