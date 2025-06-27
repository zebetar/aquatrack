
"use client";

import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer, Notification } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import {
  getAllMockCustomers,
  deleteMockCustomer,
  getMockCustomerById,
  getMockUsageRecordsByCustomerId,
  getMockPaymentsByCustomerId,
  getAllMockUsageRecords,
  updateMockCustomer, 
  addMockNotification,
} from '@/lib/mock-data-store';
import { generateCustomerPdf } from '@/lib/generate-customer-pdf';
import { Droplets } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';

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
          description: "Could not retrieve user data. Check console for details.",
        });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerUpdated = (customer: Customer) => {
    try {
      updateMockCustomer(customer);
      
      const adminNotification: Notification = {
        id: `noti-${Date.now()}-admin-update`,
        userId: 'admin001',
        message: `Customer details for ${customer.name} updated.`,
        type: 'CUSTOMER_UPDATED',
        isRead: false,
        linkTo: `/admin/customers/${customer.id}`,
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

      fetchCustomers(); // Refresh list to show updated data
    } catch (error) {
      console.error("Failed to update customer:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save customer changes. See console for details.",
      });
    }
  };

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
        description: `${customerForPdf?.name || 'Customer'} and all associated data have been removed.`,
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
      <div className="mt-6">
        {/* Skeleton for mobile card view */}
        <div className="space-y-4 md:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="glassmorphism-card p-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <Skeleton className="h-4 w-16 mb-1" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <div>
                            <Skeleton className="h-4 w-20 mb-1" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </Card>
            ))}
        </div>

        {/* Skeleton for desktop table view */}
        <div className="hidden rounded-lg border bg-card shadow-sm glassmorphism-card md:block">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableHead>
                        <TableHead className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableHead>
                        <TableHead className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></TableHead>
                        <TableHead className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                            <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                            <TableCell className="text-center"><Skeleton className="h-8 w-8 rounded-full mx-auto" /></TableCell>
                            <TableCell className="text-center"><div className="flex justify-center gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {isLoading && customers.length > 0 && (
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />
          <span>Refreshing user list...</span>
        </div>
      )}
      <CustomerListTable
        customers={customers}
        onCustomerDeleted={handleCustomerDeleted}
        onCustomerUpdated={handleCustomerUpdated}
        deletingCustomerId={deletingCustomerId}
        enableActions={true}
      />
    </div>
  );
}
