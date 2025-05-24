
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { AddCustomerDialog } from '@/components/admin/customers/add-customer-dialog';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { 
  getAllMockCustomers, 
  addMockCustomer as addCustomerToStore,
  deleteMockCustomer as deleteCustomerFromStore,
  getMockCustomerById,
  getMockUsageRecordsByCustomerId,
  getMockPaymentsByCustomerId 
} from '@/lib/mock-data-store';
import { generateCustomerPdf } from '@/lib/generate-customer-pdf';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCustomers = useCallback(() => {
    setIsLoading(true);
    const storedCustomers = getAllMockCustomers();
    setCustomers(storedCustomers);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = (newCustomer: Customer) => {
    addCustomerToStore(newCustomer);
    fetchCustomers(); // Re-fetch from store to update list
  };

  const handleCustomerDeleted = async (customerId: string) => {
    setDeletingCustomerId(customerId); // Show loading state for the specific delete action

    const customerForToastName = customers.find(c => c.id === customerId); // Get customer name for toast before deletion
    const customerDataForPdf = getMockCustomerById(customerId); // Get full customer data for PDF generation

    if (customerDataForPdf) {
      try {
        const usageRecords = getMockUsageRecordsByCustomerId(customerId);
        const payments = getMockPaymentsByCustomerId(customerId);
        await generateCustomerPdf(customerDataForPdf, usageRecords, payments);
        toast({
          title: "Statement Generated",
          description: `PDF statement for ${customerDataForPdf.name} is being downloaded.`,
        });
      } catch (error) {
        console.error("Error generating PDF before deletion:", error);
        toast({
          variant: "destructive",
          title: "PDF Generation Failed",
          description: "Could not generate PDF statement. Customer will still be deleted.",
        });
      }
    } else {
      // This case should ideally not happen if customerId is valid, but good to handle
      toast({
        variant: "destructive",
        title: "Customer Data Not Found for PDF",
        description: "Could not retrieve customer details for PDF generation. Proceeding with deletion.",
      });
    }

    // Proceed with deletion from store
    deleteCustomerFromStore(customerId);
    fetchCustomers(); // Re-fetch to update the UI list

    setDeletingCustomerId(null); // Clear loading state
    toast({
      title: "Customer Deleted",
      description: `${customerForToastName?.name || 'Customer'} and all associated data have been removed.`,
    });
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
        onCustomerDeleted={handleCustomerDeleted}
        deletingCustomerId={deletingCustomerId}
      />
    </>
  );
}
