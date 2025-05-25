
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
// --- Firestore Example Import (uncomment when ready) ---
// import { getAllCustomersFromFirestore } from '@/lib/firestore-service'; // Assuming you create this file
import { Loader2 } from 'lucide-react';

type CustomerWithUsage = Customer & { totalUsageHours?: number };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchCustomers = useCallback(async () => { // Made async for Firestore example
    setIsLoading(true);
    
    // --- Current localStorage logic ---
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
    const storedCustomers = getAllMockCustomers();
    const usageRecords = getAllMockUsageRecords();

    const customersWithUsage: CustomerWithUsage[] = storedCustomers.map(customer => {
      const customerUsage = usageRecords
        .filter(record => record.customerId === customer.id)
        .reduce((sum, record) => sum + record.durationHours, 0);
      return { ...customer, totalUsageHours: customerUsage };
    });
    setCustomers(customersWithUsage.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    // --- End localStorage logic ---

    // --- Firestore Example (replace above block when ready) ---
    /* 
    try {
      const firestoreCustomers = await getAllCustomersFromFirestore(); 
      // You would also fetch all usage records from Firestore here to calculate totalUsageHours
      // const firestoreUsageRecords = await getAllUsageRecordsFromFirestore(); 
      // const customersWithUsage: CustomerWithUsage[] = firestoreCustomers.map(customer => {
      //   const customerUsage = firestoreUsageRecords
      //     .filter(record => record.customerId === customer.id)
      //     .reduce((sum, record) => sum + record.durationHours, 0);
      //   return { ...customer, totalUsageHours: customerUsage };
      // });
      // setCustomers(customersWithUsage.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setCustomers(firestoreCustomers); // Simplified for example
    } catch (error) {
      console.error("Failed to fetch customers from Firestore:", error);
      // Handle error appropriately, e.g., show a toast
    }
    */
    // --- End Firestore Example ---
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = (newCustomer: Customer) => {
    // This currently uses the mock store (localStorage)
    addCustomerToStore(newCustomer); 
    
    // --- Firestore Example: addCustomerToFirestore would be async ---
    // await addCustomerToFirestore(newCustomer); 
    
    const adminNotification: Notification = {
        id: `noti-${Date.now()}-admin-newcust`,
        userId: 'admin001', 
        message: `New customer added: ${newCustomer.name}.`,
        type: 'CUSTOMER_ADDED',
        isRead: false,
        linkTo: `/admin/customers/${newCustomer.id}`,
        createdAt: new Date(),
    };
    addMockNotification(adminNotification); // This would also go to Firestore

    fetchCustomers(); // Re-fetch to update UI (from localStorage or Firestore)
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
        onCustomerDeleted={() => { /* Deletion handled on User Management page or elsewhere */ }}
        deletingCustomerId={null} 
        enableActions={false} // Actions (like delete) are not on this page
      />
    </>
  );
}
