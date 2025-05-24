
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { 
  getAllMockCustomers, 
  deleteMockCustomer as deleteCustomerFromStore,
  getMockCustomerById,
  getMockUsageRecordsByCustomerId,
  getMockPaymentsByCustomerId 
} from '@/lib/mock-data-store';
import { generateCustomerPdf } from '@/lib/generate-customer-pdf';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminUsersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCustomers = useCallback(() => {
    setIsLoading(true);
    // Simulate a small delay
    setTimeout(() => {
      const storedCustomers = getAllMockCustomers();
      setCustomers(storedCustomers);
      setIsLoading(false);
    }, 100);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerDeleted = async (customerId: string) => {
    setDeletingCustomerId(customerId);
    const customerForToastName = customers.find(c => c.id === customerId);
    const customerDataForPdf = getMockCustomerById(customerId);

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
      toast({
        variant: "destructive",
        title: "Customer Data Not Found for PDF",
        description: "Could not retrieve customer details for PDF generation. Proceeding with deletion.",
      });
    }

    deleteCustomerFromStore(customerId);
    fetchCustomers(); 
    setDeletingCustomerId(null);
    toast({
      title: "Customer Deleted",
      description: `${customerForToastName?.name || 'Customer'} and all associated data have been removed.`,
    });
  };

  if (isLoading && customers.length === 0) { 
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading users...</p>
        </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="User Management" 
        description="View and manage customer accounts. Deleting a customer will also download their statement."
      />
        <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/settings">Back to Settings</Link>
      </Button>
      {isLoading && customers.length > 0 && ( 
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Refreshing user list...</span>
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
