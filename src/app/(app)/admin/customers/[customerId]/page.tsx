
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
import { 
  getMockCustomerById, 
  getMockUsageRecordsByCustomerId, 
  getMockPaymentsByCustomerId,
  addMockUsageRecord,
  addMockPayment
} from '@/lib/mock-data-store';

// Placeholder data fetching functions using the store
async function getCustomerDetailsFromStore(customerId: string): Promise<Customer | null> {
  // await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  const customer = getMockCustomerById(customerId);
  if (customer) return customer;

  // Fallback for testing or if customerId is not in store (should ideally not happen in normal flow)
  return { 
    id: customerId, 
    name: `Customer ${customerId.substring(0,5)} (Not in Store)`, 
    contactInfo: 'N/A', 
    createdAt: new Date(), 
    balance: 0 
  };
}

async function getWaterUsageFromStore(customerId: string): Promise<WaterUsageRecord[]> {
  // await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  return getMockUsageRecordsByCustomerId(customerId);
}

async function getPaymentsFromStore(customerId: string): Promise<Payment[]> {
  // await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  return getMockPaymentsByCustomerId(customerId);
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
        getCustomerDetailsFromStore(params.customerId),
        getWaterUsageFromStore(params.customerId),
        getPaymentsFromStore(params.customerId)
      ]);
      setCustomer(custData);
      setUsageRecords(usageData);
      setPayments(paymentData);
    } catch (error) {
      console.error("Failed to load customer data from store", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.customerId]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleAddUsageRecord = (newRecord: WaterUsageRecord) => {
    addMockUsageRecord(newRecord); // Adds to store & updates customer balance in store
    // Refresh data from store for this page
    const updatedCustomer = getMockCustomerById(params.customerId);
    const updatedUsageRecords = getMockUsageRecordsByCustomerId(params.customerId);
    if (updatedCustomer) setCustomer(updatedCustomer);
    setUsageRecords(updatedUsageRecords);
  };

  const handleAddPaymentRecord = (newPayment: Payment) => {
    addMockPayment(newPayment); // Adds to store & updates customer balance in store
    // Refresh data from store for this page
    const updatedCustomer = getMockCustomerById(params.customerId);
    const updatedPayments = getMockPaymentsByCustomerId(params.customerId);
    if (updatedCustomer) setCustomer(updatedCustomer);
    setPayments(updatedPayments);
  };

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
        <PageHeader title="Customer Not Found" description="This customer may not exist in the mock store." />
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
            <RecordPaymentDialog customer={customer} onPaymentRecorded={handleAddPaymentRecord} /> 
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
