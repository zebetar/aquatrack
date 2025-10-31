
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import type { Customer } from '@/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Droplets, Search, UserCog } from 'lucide-react';
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
import { getAllCustomers, getUsageRecordsByCustomerId } from '@/lib/firebase-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type CustomerWithUsage = Customer & { totalUsageHours?: number };

export default function AdminUserManagementPage() {
  const [customers, setCustomers] = useState<CustomerWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedCustomers = await getAllCustomers();
      const customersWithUsage: CustomerWithUsage[] = await Promise.all(storedCustomers.map(async (customer) => {
        const usageRecords = await getUsageRecordsByCustomerId(customer.id);
        const totalUsageHours = usageRecords.reduce((sum, record) => sum + record.durationHours, 0);
        return { ...customer, totalUsageHours };
      }));
      setCustomers(customersWithUsage);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load customer data.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerDeleted = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setDeletingCustomerId(null);
  };
  
  const handleCustomerUpdated = () => {
    fetchCustomers(); // Refetch all customers to get the updated data
  }

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customers, searchTerm]);
  
  if (isLoading && customers.length === 0) { 
    return (
      <div className="mt-6">
        <PageHeader 
            title="User Management"
            description="Edit and delete customer accounts." 
            actions={<div className="flex items-center gap-2"><Skeleton className="h-10 w-10" /></div>}
        />
        {/* Skeleton for mobile card view */}
        <div className="space-y-4 md:hidden">
            {Array.from({ length: 3 }).map((_, i) => (
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
                         <TableHead className="text-center"><Skeleton className="h-5 w-24 mx-auto" /></TableHead>
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
                            <TableCell className="text-center"><Skeleton className="h-8 w-24 rounded-md mx-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
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
    </div>
  );

  return (
    <div className="mt-6">
      <PageHeader 
        title="User Management"
        description="Edit and delete customer accounts."
        actions={pageActions}
      />
      
      {isLoading && customers.length > 0 && ( 
        <div className="my-4 flex items-center justify-center text-muted-foreground">
          <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />
          <span>Refreshing customer list...</span>
        </div>
      )}

      <CustomerListTable 
        customers={filteredCustomers} 
        onCustomerDeleted={handleCustomerDeleted}
        onCustomerUpdated={handleCustomerUpdated}
        deletingCustomerId={deletingCustomerId} 
        enableActions={true}
      />
    </div>
  );
}
