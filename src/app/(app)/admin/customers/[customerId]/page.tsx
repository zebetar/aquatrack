
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

// Placeholder data fetching functions
async function getCustomerDetails(customerId: string): Promise<Customer | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  // In a real app, fetch from a database. For mock, return null if no specific logic.
  // This part is tricky for mock, as we don't have a list of customers to find from.
  // Let's assume if we reach here, the customerId is valid for mock purposes.
  // Or, for now, we can return a mock customer if no other mechanism provides it.
  // For this example, we'll rely on the fact that navigation to this page implies customer exists.
  // If a robust mock is needed, it should be fetched from a shared mock store or context.
  if (customerId === "clearedCust") return null; // Example from previous state
  
  // For the purpose of making the page work standalone if needed for testing, return a default mock.
  // In a real flow, this customer object would be more meaningfully populated.
  return { 
    id: customerId, 
    name: `Customer ${customerId.substring(0,5)}`, 
    contactInfo: 'N/A', 
    createdAt: new Date(), 
    balance: 0 
  };
}

async function getWaterUsage(customerId: string): Promise<WaterUsageRecord[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return []; // Start with empty, will be populated by state
}

async function getPayments(customerId: string): Promise<Payment[]> {
   await new Promise(resolve => setTimeout(resolve, 100));
  return []; // Start with empty
}


export default function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [usageRecords, setUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomerData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [custData, usageData, paymentData] = await Promise.all([
        getCustomerDetails(params.customerId),
        getWaterUsage(params.customerId),
        getPayments(params.customerId)
      ]);
      setCustomer(custData);
      setUsageRecords(usageData);
      setPayments(paymentData);
    } catch (error) {
      console.error("Failed to load customer data", error);
      // Potentially set an error state here
    } finally {
      setIsLoading(false);
    }
  }, [params.customerId]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleAddUsageRecord = (newRecord: WaterUsageRecord) => {
    setUsageRecords(prevRecords => [...prevRecords, newRecord].sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
    // In a real app, you might also update the customer's balance here or server-side
    if (customer) {
        setCustomer(prevCustomer => prevCustomer ? {...prevCustomer, balance: prevCustomer.balance + newRecord.cost} : null);
    }
  };

  // Add similar handler for payments if needed:
  // const handleAddPaymentRecord = (newPayment: Payment) => { ... }

  if (isLoading) {
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
        <PageHeader title="Customer Not Found" description="This customer may not exist or data has been cleared." />
        <p className="text-muted-foreground">The requested customer could not be found or their data is not available.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/admin/customers"><ArrowLeft className="mr-2 h-4 w-4" />Back to Customers</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title={customer.name} 
        description={`Details for customer ID: ${customer.id}`}
        actions={
          <div className="flex gap-2">
            <LogUsageDialog customer={customer} onUsageLogged={handleAddUsageRecord} />
            <RecordPaymentDialog customer={customer} /> 
            {/* Pass onPaymentRecorded={handleAddPaymentRecord} to RecordPaymentDialog if implementing similar state update */}
          </div>
        }
      />
      <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/customers"><ArrowLeft className="mr-2 h-4 w-4" />Back to Customers List</Link>
      </Button>
      <CustomerDetailsView customer={customer} usageRecords={usageRecords} payments={payments} />
    </>
  );
}
