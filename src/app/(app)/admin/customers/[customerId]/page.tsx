
"use client";

import type { Customer, WaterUsageRecord, Payment, Notification } from '@/types';
import { CustomerDetailsView } from '@/components/admin/customers/customer-details-view';
import { LogUsageDialog } from '@/components/admin/customers/log-usage-dialog';
import { RecordPaymentDialog } from '@/components/admin/customers/record-payment-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Droplets } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { formatDurationFromHours } from '@/lib/utils';
import { 
  getMockCustomerById,
  getMockUsageRecordsByCustomerId,
  getMockPaymentsByCustomerId,
  addMockUsageRecord,
  addMockPayment,
  updateMockUsageRecord,
  updateMockPaymentRecord,
  addMockNotification
} from '@/lib/mock-data-store';

export default function CustomerDetailPage() {
  const routeParams = useParams<{ customerId: string }>();
  const customerId = routeParams.customerId;
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [usageRecords, setUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomerData = useCallback(() => {
    if (!customerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const custData = getMockCustomerById(customerId);
      const usageData = getMockUsageRecordsByCustomerId(customerId);
      const paymentData = getMockPaymentsByCustomerId(customerId);
      
      setCustomer(custData || null);
      setUsageRecords(usageData || []);
      setPayments(paymentData || []);
    } catch (error) {
      console.error("Failed to load customer data from mock store", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load customer data. Check console for details." });
    } finally {
      setIsLoading(false);
    }
  }, [customerId, toast]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleAddUsageRecord = (newRecord: WaterUsageRecord) => {
    if (!customerId || !customer) return;
    try {
      addMockUsageRecord(newRecord);

      const viewerNotification: Notification = {
          id: `noti-${Date.now()}-viewer`,
          userId: customer.authUID || customer.id,
          message: `New water usage logged: ${formatDurationFromHours(newRecord.durationHours)}, Cost: PKR ${newRecord.cost.toLocaleString()}.`,
          type: 'USAGE_LOGGED',
          isRead: false,
          linkTo: `/viewer/usage`,
          createdAt: new Date(),
      };
      addMockNotification(viewerNotification);

      const adminNotification: Notification = {
          id: `noti-${Date.now()}-admin`,
          userId: 'admin001',
          message: `Water usage logged for ${customer.name}: ${formatDurationFromHours(newRecord.durationHours)}.`,
          type: 'USAGE_LOGGED',
          isRead: false,
          linkTo: `/admin/customers/${customer.id}`,
          createdAt: new Date(),
      };
      addMockNotification(adminNotification);

      fetchCustomerData();
      toast({ title: "Usage Logged", description: `${formatDurationFromHours(newRecord.durationHours)} logged for ${newRecord.customerName}.` });
    } catch (error) {
      console.error("Failed to log usage record:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not log water usage. Please try again." });
    }
  };

  const handleAddPaymentRecord = (newPayment: Payment) => {
    if (!customerId || !customer) return;
    try {
      addMockPayment(newPayment);

      const viewerNotification: Notification = {
          id: `noti-${Date.now()}-viewer`,
          userId: customer.authUID || customer.id,
          message: `Payment of PKR ${newPayment.amountPaid.toLocaleString()} has been recorded.`,
          type: 'PAYMENT_RECORDED',
          isRead: false,
          linkTo: `/viewer/billing`,
          createdAt: new Date(),
      };
      addMockNotification(viewerNotification);

      const adminNotification: Notification = {
          id: `noti-${Date.now()}-admin`,
          userId: 'admin001',
          message: `Payment of PKR ${newPayment.amountPaid.toLocaleString()} recorded for ${customer.name}.`,
          type: 'PAYMENT_RECORDED',
          isRead: false,
          linkTo: `/admin/customers/${customer.id}`,
          createdAt: new Date(),
      };
      addMockNotification(adminNotification);

      fetchCustomerData();
      toast({ title: "Payment Recorded", description: `PKR ${newPayment.amountPaid.toLocaleString()} recorded.`});
    } catch (error) {
      console.error("Failed to record payment:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not record payment. Please try again." });
    }
  };

  const handleUpdateUsageRecord = (updatedRecord: WaterUsageRecord) => {
    if (!customerId || !customer) return;
    try {
      updateMockUsageRecord(updatedRecord);
      fetchCustomerData();
      toast({ title: "Usage Record Updated", description: `Usage record for ${updatedRecord.customerName} has been updated.` });
    } catch(error) {
      console.error("Failed to update usage record:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update usage record." });
    }
  };

  const handleUpdatePaymentRecord = (updatedPayment: Payment) => {
    if (!customerId || !customer) return;
    try {
      updateMockPaymentRecord(updatedPayment);
      fetchCustomerData();
      toast({ title: "Payment Record Updated", description: `Payment record for ${updatedPayment.customerName} has been updated.` });
    } catch (error) {
      console.error("Failed to update payment record:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update payment record." });
    }
  };

  if (isLoading && !customer) { 
    return (
      <div className="flex h-full items-center justify-center mt-6">
        <Droplets className="h-8 w-8 animate-pulse-subtle text-primary" />
        <p className="ml-2">Loading customer details...</p>
      </div>
    );
  }

  if (!customer) {
    const UserPlaceholderIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-12 w-12 text-muted-foreground">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    );
    return (
      <div className="mt-6">
        <div className="rounded-lg border bg-card p-4 text-center shadow-sm glassmorphism-card">
            <UserPlaceholderIcon />
            <h3 className="mt-4 text-lg font-medium">Customer Not Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
            This customer may not exist or data could not be loaded.
            </p>
        </div>
        <Button variant="outline" asChild className="mt-6">
          <Link href="/admin/customers"><ArrowLeft className="mr-2 h-4 w-4" />Back to Customers</Link>
        </Button>
      </div>
    );
  }

  const showInlineLoader = isLoading && customer;

  return (
    <div className="mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full flex justify-center items-center sm:w-auto sm:justify-start sm:gap-3">
            <Button asChild variant="ghost" size="icon" className="absolute left-0 sm:static rounded-full h-10 w-10 hover:bg-muted">
              <Link href="/admin/customers" aria-label="Back to Customers List">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl pt-1">{customer.name}</h1>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          <LogUsageDialog customer={customer} onUsageLogged={handleAddUsageRecord} />
          <RecordPaymentDialog customer={customer} onPaymentRecorded={handleAddPaymentRecord} />
        </div>
      </div>
      
      {showInlineLoader && (
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />
          <span>Refreshing data...</span>
        </div>
      )}

      <CustomerDetailsView 
        customer={customer} 
        usageRecords={[...usageRecords]} 
        payments={[...payments]}
        onUsageRecordUpdated={handleUpdateUsageRecord}
        onPaymentRecordUpdated={handleUpdatePaymentRecord}
      />
    </div>
  );
}
