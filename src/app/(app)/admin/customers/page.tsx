
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { AddCustomerDialog } from '@/components/admin/customers/add-customer-dialog';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer, Notification, WaterUsageRecord } from '@/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getAllMockCustomers, 
  addMockCustomer,
  addMockNotification,
  getAllMockUsageRecords 
} from '@/lib/mock-data-store';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

type CustomerWithUsage = Customer & { totalUsageHours?: number };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
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
    } catch (error) {
        console.error("Failed to fetch customers from mock store:", error);
        toast({
          variant: "destructive",
          title: "Failed to load customers",
          description: "Could not retrieve customer data. Check console for details.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = (newCustomer: Customer) => {
    try {
      addMockCustomer(newCustomer);
      
      const adminNotification: Notification = {
          id: `noti-${Date.now()}-admin-newcust`,
          userId: 'admin001', 
          message: `New customer added: ${newCustomer.name}.`,
          type: 'CUSTOMER_ADDED',
          isRead: false,
          linkTo: `/admin/customers/${newCustomer.id}`,
          createdAt: new Date(),
      };
      addMockNotification(adminNotification);

      fetchCustomers();
    } catch (error) {
        console.error("Failed to add customer to mock store:", error);
        toast({
          variant: "destructive",
          title: "Failed to add customer",
          description: "Could not save new customer. Please try again.",
        });
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customers, searchTerm]);

  if (isLoading && customers.length === 0) { 
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading customers...</p>
        </div>
    );
  }

  const searchInput = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input 
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  );

  const pageActions = (
    <div className="flex items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search Customers</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Search Customers</DialogTitle>
          </DialogHeader>
          {searchInput}
        </DialogContent>
      </Dialog>
      <AddCustomerDialog onCustomerAdded={handleAddCustomer} />
    </div>
  );

  return (
    <div className="mt-6">
      <PageHeader 
        title="Customer Management" 
        actions={pageActions}
      />
      
      {isLoading && customers.length > 0 && ( 
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Refreshing customer list...</span>
        </div>
      )}
      <CustomerListTable 
        customers={filteredCustomers} 
        onCustomerDeleted={() => { /* Deletion handled on User Management page or elsewhere */ }}
        deletingCustomerId={null} 
        enableActions={false}
      />
    </div>
  );
}
