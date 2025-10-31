"use client";

import { PageHeader } from '@/components/shared/page-header';
import type { Payment } from '@/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Droplets, Search } from 'lucide-react';
import { PaymentList } from '@/components/admin/payments/payment-list';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { getAllMockPayments } from '@/lib/mock-data-store';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadPaymentData = useCallback(() => {
    setIsLoading(true);
    const records = getAllMockPayments();
    setPayments(records);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);
  
  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;
    return payments.filter(p => p.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [payments, searchTerm]);

  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Droplets className="h-8 w-8 animate-pulse-subtle text-primary" />
            <p className="ml-2">Loading payment records...</p>
        </div>
    );
  }

  const searchInput = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input 
        placeholder="Search by customer name..."
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
            <span className="sr-only">Search Payments</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Search Payments</DialogTitle>
          </DialogHeader>
          {searchInput}
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="mt-6">
      <PageHeader 
        title="All Payment Records"
        actions={pageActions}
      />
      <PaymentList payments={filteredPayments} />
    </div>
  );
}
