
"use client";

import { PageHeader } from '@/components/shared/page-header';
import type { Payment } from '@/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllMockPayments } from '@/lib/mock-data-store';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentList } from '@/components/admin/payments/payment-list';
import { Input } from '@/components/ui/input';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const loadPaymentData = useCallback(() => {
    setIsLoading(true);
    try {
      const records = getAllMockPayments();
      setPayments(records);
    } catch (error) {
      console.error("Failed to fetch payments from mock store:", error);
      toast({
        variant: "destructive",
        title: "Failed to load payments",
        description: "Could not retrieve payment data. Check console for details.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading payment records...</p>
        </div>
    );
  }

  return (
    <div className="mt-6">
      <PageHeader 
        title="All Payment Records"
      />
       <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search by customer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full max-w-sm"
        />
      </div>
      <PaymentList payments={filteredPayments} />
    </div>
  );
}
