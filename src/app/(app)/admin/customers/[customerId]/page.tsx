
"use client";

import { PageHeader } from '@/components/shared/page-header';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { CustomerDetailsView } from '@/components/admin/customers/customer-details-view';
import { LogUsageDialog } from '@/components/admin/customers/log-usage-dialog';
import { RecordPaymentDialog } from '@/components/admin/customers/record-payment-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  getMockCustomerById, 
  getMockUsageRecordsByCustomerId, 
  getMockPaymentsByCustomerId,
  addMockUsageRecord,
  addMockPayment,
  updateMockCustomer
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

  const fetchCustomerData = useCallback(async () => {
    if (!customerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Simulate async fetch
      await new Promise(resolve => setTimeout(resolve, 200)); 
      const custData = getMockCustomerById(customerId);
      const usageData = getMockUsageRecordsByCustomerId(customerId);
      const paymentData = getMockPaymentsByCustomerId(customerId);
      
      setCustomer(custData || null);
      if (custData) { // Initialize editedCustomerData when customer data is fetched
        setEditedCustomerData(custData);
      }
      setUsageRecords(usageData || []);
      setPayments(paymentData || []);
    } catch (error) {
      console.error("Failed to load customer data from store", error);
      if (!customer) { 
        setCustomer({ 
            id: customerId, 
            name: `Customer ${customerId.substring(0,5)} (Error Loading)`, 
            contactInfo: 'N/A', 
            email: 'N/A',
            createdAt: new Date(), 
            balance: 0 
        });
        setEditedCustomerData({ 
            id: customerId, 
            name: `Customer ${customerId.substring(0,5)} (Error Loading)`, 
            contactInfo: 'N/A',
            email: 'N/A',
        });
      }
       toast({ variant: "destructive", title: "Error", description: "Could not load customer data." });
    } finally {
      setIsLoading(false);
    }
  }, [customerId, toast]); // Removed 'customer' from dependencies to avoid re-triggering fetch on its own update

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]); 

  const handleAddUsageRecord = (newRecord: WaterUsageRecord) => {
    if (!customerId) return;
    addMockUsageRecord(newRecord); 
    
    const updatedCustomer = getMockCustomerById(customerId);
    const updatedUsageRecords = getMockUsageRecordsByCustomerId(customerId);
    
    if (updatedCustomer) {
      setCustomer(updatedCustomer);
      setEditedCustomerData(updatedCustomer); // Also update edited data if currently editing or for next edit
    }
    setUsageRecords([...updatedUsageRecords]); 
    toast({ title: "Usage Logged", description: `${newRecord.durationHours.toFixed(2)} hours logged for ${newRecord.customerName}.` });
  };

  const handleAddPaymentRecord = (newPayment: Payment) => {
    if (!customerId) return;
    addMockPayment(newPayment);
    
    const updatedCustomer = getMockCustomerById(customerId);
    const updatedPayments = getMockPaymentsByCustomerId(customerId);

    if (updatedCustomer) {
      setCustomer(updatedCustomer);
      setEditedCustomerData(updatedCustomer);
    }
    setPayments([...updatedPayments]); 
    toast({ title: "Payment Recorded", description: `PKR ${newPayment.amountPaid.toLocaleString()} recorded.`});
  };

  const handleToggleEdit = () => {
    if (!isEditing && customer) {
      // When starting to edit, populate form with current customer data
      setEditedCustomerData({ ...customer });
    }
    setIsEditing(!isEditing);
  };

  const handleFieldChange = (field: keyof Customer, value: string) => {
    setEditedCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = () => {
    if (customer && editedCustomerData) {
      const updatedCustomerData: Customer = {
        ...customer, // Preserve non-editable fields like id, createdAt, balance, authUID
        name: editedCustomerData.name || customer.name,
        contactInfo: editedCustomerData.contactInfo, // Can be undefined
        email: editedCustomerData.email, // Can be undefined
      };
      updateMockCustomer(updatedCustomerData);
      setCustomer(updatedCustomerData); // Immediately update displayed customer
      setIsEditing(false);
      toast({ title: "Customer Updated", description: "Customer details have been saved." });
    }
  };

  const handleCancelChanges = () => {
    if (customer) {
      // Reset edited data to original customer data
      setEditedCustomerData({ ...customer });
    }
    setIsEditing(false);
  };


  if (isLoading && !customer) {
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

  const showInlineLoader = isLoading && customer;

  return (
    <>
      <PageHeader 
        title={customer.name} 
        // description prop removed here
        actions={
          <div className="flex gap-2">
            {!isEditing && <LogUsageDialog customer={customer} onUsageLogged={handleAddUsageRecord} />}
            {!isEditing && <RecordPaymentDialog customer={customer} onPaymentRecorded={handleAddPaymentRecord} />}
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

      <CustomerDetailsView 
        customer={customer} 
        usageRecords={usageRecords} 
        payments={payments}
        isEditing={isEditing}
        editedCustomerData={editedCustomerData}
        onFieldChange={handleFieldChange}
        onToggleEdit={handleToggleEdit}
        onSaveChanges={handleSaveChanges}
        onCancelChanges={handleCancelChanges}
      />
    </>
  );
}
