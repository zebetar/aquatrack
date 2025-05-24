
"use client";

import { PageHeader } from '@/components/shared/page-header';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { CustomerDetailsView } from '@/components/admin/customers/customer-details-view';
import { LogUsageDialog } from '@/components/admin/customers/log-usage-dialog';
import { RecordPaymentDialog } from '@/components/admin/customers/record-payment-dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  getMockCustomerById, 
  getMockUsageRecordsByCustomerId, 
  getMockPaymentsByCustomerId,
  addMockUsageRecord,
  addMockPayment
} from '@/lib/mock-data-store';

// Placeholder data fetching functions using the store
async function getCustomerDetailsFromStore(customerId: string): Promise<Customer | null> {
  const customer = getMockCustomerById(customerId);
  // No delay here for faster UI updates if data is already in store
  return customer || null; 
}

async function getWaterUsageFromStore(customerId: string): Promise<WaterUsageRecord[]> {
  return getMockUsageRecordsByCustomerId(customerId);
}

async function getPaymentsFromStore(customerId: string): Promise<Payment[]> {
  return getMockPaymentsByCustomerId(customerId);
}


export default function CustomerDetailPage() {
  const routeParams = useParams<{ customerId: string }>();
  const customerId = routeParams.customerId;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [usageRecords, setUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomerData = useCallback(async () => {
    if (!customerId) return; 
    setIsLoading(true);
    try {
      const [custData, usageData, paymentData] = await Promise.all([
        getCustomerDetailsFromStore(customerId),
        getWaterUsageFromStore(customerId),
        getPaymentsFromStore(customerId)
      ]);
      setCustomer(custData);
      setUsageRecords(usageData || []);
      setPayments(paymentData || []);
    } catch (error) {
      console.error("Failed to load customer data from store", error);
      // Fallback for testing if customerId is not in store after an error
      if (!customer) { // only set fallback if customer is still null
        setCustomer({ 
            id: customerId, 
            name: `Customer ${customerId.substring(0,5)} (Error Loading)`, 
            contactInfo: 'N/A', 
            createdAt: new Date(), 
            balance: 0 
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [customerId, customer]); // Added customer to dependencies to potentially help with re-fetch if needed, though primary trigger is customerId

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]); // fetchCustomerData is memoized, so this runs when customerId changes

  const handleAddUsageRecord = (newRecord: WaterUsageRecord) => {
    if (!customerId) return;
    addMockUsageRecord(newRecord); // Adds to store & updates customer balance in store
    
    // Refresh data from store for this page
    const updatedCustomer = getMockCustomerById(customerId);
    const updatedUsageRecords = getMockUsageRecordsByCustomerId(customerId);
    
    if (updatedCustomer) setCustomer(updatedCustomer);
    // Ensure a new array reference is passed to trigger re-render
    setUsageRecords([...updatedUsageRecords]); 
  };

  const handleAddPaymentRecord = (newPayment: Payment) => {
    if (!customerId) return;
    addMockPayment(newPayment); // Adds to store & updates customer balance in store
    
    // Refresh data from store for this page
    const updatedCustomer = getMockCustomerById(customerId);
    const updatedPayments = getMockPaymentsByCustomerId(customerId);

    if (updatedCustomer) setCustomer(updatedCustomer);
    // Ensure a new array reference is passed to trigger re-render
    setPayments([...updatedPayments]); 
  };

  if (isLoading && !customer) { // Show full page loader only if customer is not yet loaded at all
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading customer details...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <>
        <PageHeader title="Customer Not Found" description="This customer may not exist or data could not be loaded." />
        <p className="text-muted-foreground">The requested customer could not be found or their data is not available.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/admin/customers"><ArrowLeft className="mr-2 h-4 w-4" />Back to Customers</Link>
        </Button>
      </>
    );
  }

  // Show a subtle loading indicator if we are in a loading state but already have some customer data
  const showInlineLoader = isLoading && customer;

  return (
    <>
      <PageHeader 
        title={customer.name} 
        description={`Details for customer ID: ${customer.id}`}
        actions={
          <div className="flex gap-2">
            <LogUsageDialog customer={customer} onUsageLogged={handleAddUsageRecord} />
            <RecordPaymentDialog customer={customer} onPaymentRecorded={handleAddPaymentRecord} /> 
          </div>
        }
      />
      <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/customers"><ArrowLeft className="mr-2 h-4 w-4" />Back to Customers List</Link>
      </Button>
      
      {showInlineLoader && (
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Refreshing data...</span>
        </div>
      )}

      <CustomerDetailsView customer={customer} usageRecords={usageRecords} payments={payments} />
    </>
  );
}

