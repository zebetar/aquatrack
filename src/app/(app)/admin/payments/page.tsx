
"use client";

import { PageHeader } from '@/components/shared/page-header';
import type { Payment } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { getAllMockPayments } from '@/lib/mock-data-store';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentList } from '@/components/admin/payments/payment-list';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
      <PaymentList payments={payments} />
    </div>
  );
}
