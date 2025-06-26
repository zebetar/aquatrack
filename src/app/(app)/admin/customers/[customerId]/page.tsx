
"use client";

import type { Customer, WaterUsageRecord, Payment, Notification } from '@/types';
import { CustomerDetailsView } from '@/components/admin/customers/customer-details-view';
import { LogUsageDialog } from '@/components/admin/customers/log-usage-dialog';
import { RecordPaymentDialog } from '@/components/admin/customers/record-payment-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
  updateMockCustomer,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomerData, setEditedCustomerData] = useState<Partial<Customer>>({});

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
      if (custData) { 
        setEditedCustomerData(custData);
      }
      setUsageRecords(usageData || []);
      setPayments(paymentData || []);
    } catch (error) {
      console.error("Failed to load customer data from mock store", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load customer data from the mock store. Check console for details." });
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

  const handleToggleEdit = () => {
    if (!isEditing && customer) {
      setEditedCustomerData({ ...customer });
    }
    setIsEditing(!isEditing);
  };

  const handleFieldChange = (field: keyof Customer, value: string) => {
    setEditedCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = () => {
    if (customer && customerId && editedCustomerData) {
      try {
        const updatedData: Partial<Customer> = {
          name: editedCustomerData.name || customer.name,
          contactInfo: editedCustomerData.contactInfo,
          email: editedCustomerData.email ? editedCustomerData.email.trim().toLowerCase() : undefined,
        };

        updateMockCustomer({ id: customerId, ...updatedData });
        
        const adminNotification: Notification = {
          id: `noti-${Date.now()}-admin-update`,
          userId: 'admin001',
          message: `Customer details for ${updatedData.name} updated.`,
          type: 'CUSTOMER_UPDATED',
          isRead: false,
          linkTo: `/admin/customers/${customerId}`,
          createdAt: new Date(),
        };
        addMockNotification(adminNotification);

        if (customer.authUID) {
          const viewerNotification: Notification = {
              id: `noti-${Date.now()}-viewer-update`,
              userId: customer.authUID,
              message: `Your account details have been updated by an administrator.`,
              type: 'CUSTOMER_UPDATED',
              isRead: false,
              linkTo: `/viewer/profile`,
              createdAt: new Date(),
          };
          addMockNotification(viewerNotification);
        }

        fetchCustomerData();
        setIsEditing(false);
        toast({ title: "Customer Updated", description: "Customer details have been saved." });
      } catch (error) {
        console.error("Failed to save customer changes:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not save customer details." });
      }
    }
  };

  const handleCancelChanges = () => {
    if (customer) {
      setEditedCustomerData({ ...customer });
    }
    setIsEditing(false);
  };

  if (isLoading && !customer) { 
    return (
      <div className="flex h-full items-center justify-center mt-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{customer.name}</h1>
        <div className="flex gap-2 flex-wrap">
          {!isEditing && <LogUsageDialog customer={customer} onUsageLogged={handleAddUsageRecord} />}
          {!isEditing && <RecordPaymentDialog customer={customer} onPaymentRecorded={handleAddPaymentRecord} />}
        </div>
      </div>
      <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/customers"><ArrowLeft className="mr-2 h-4 w-4" />Back to Customers List</Link>
      </Button>
      
      {showInlineLoader && (
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Refreshing data...</span>
        </div>
      )}

      <CustomerDetailsView 
        customer={customer} 
        usageRecords={[...usageRecords]} 
        payments={[...payments]}
        isEditing={isEditing}
        editedCustomerData={editedCustomerData}
        onFieldChange={handleFieldChange}
        onToggleEdit={handleToggleEdit}
        onSaveChanges={handleSaveChanges}
        onCancelChanges={handleCancelChanges}
        onUsageRecordUpdated={handleUpdateUsageRecord}
        onPaymentRecordUpdated={handleUpdatePaymentRecord}
      />
    </div>
  );
}
