
"use client";

import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import {
  getAllMockCustomers,
  deleteMockCustomer,
  getMockCustomerById,
  getMockUsageRecordsByCustomerId,
  getMockPaymentsByCustomerId,
  getAllMockUsageRecords
} from '@/lib/mock-data-store';
import { generateCustomerPdf } from '@/lib/generate-customer-pdf';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CustomerWithUsage = Customer & { totalUsageHours?: number };

export default function AdminUsersPage() {
  const [customers, setCustomers] = useState<CustomerWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCustomers = useCallback(() => {
    setIsLoading(true);
    try {
      const storedCustomers = getAllMockCustomers();
      const usageRecords = getAllMockUsageRecords();

      const customersWithUsage: CustomerWithUsage[] = storedCustomers.map(customer => {
        const customerUsage = usageRecords
          .filter(record => record.customerId === customer.id)
          .reduce((sum, record) => sum + record.durationHours, 0);
        return { ...customer, totalUsageHours: customerUsage };
      });

      setCustomers(customersWithUsage);
    } catch(error) {
       console.error("Failed to fetch users from mock store:", error);
       toast({
          variant: "destructive",
          title: "Failed to load users",
          description: "Could not retrieve user data from the mock store. Check console for details.",
        });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerDeleted = async (customerId: string) => {
    setDeletingCustomerId(customerId);
    
    try {
      const customerForPdf = getMockCustomerById(customerId);

      if (customerForPdf) {
        try {
          const usageRecords = getMockUsageRecordsByCustomerId(customerId);
          const payments = getMockPaymentsByCustomerId(customerId);
          await generateCustomerPdf(customerForPdf, usageRecords, payments);
          toast({
            title: "Statement Generated",
            description: `PDF statement for ${customerForPdf.name} is being downloaded.`,
          });
        } catch (pdfError) {
          console.error("Error generating PDF before deletion:", pdfError);
          toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: "Could not generate PDF statement. Customer will still be deleted.",
          });
        }
      }

      deleteMockCustomer(customerId);
      toast({
        title: "Customer Deleted",
        description: `${customerForPdf?.name || 'Customer'} and all associated data have been removed from the mock store.`,
      });

    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "An error occurred while deleting the customer. See console for details.",
      });
    } finally {
      setDeletingCustomerId(null);
      fetchCustomers(); // Refresh the customer list
    }
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
    <div className="mt-6">
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
        enableActions={true}
      />
    </div>
  );
}
