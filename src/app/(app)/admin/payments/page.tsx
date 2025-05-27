
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Payment } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { getAllMockPayments } from '@/lib/mock-data-store';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPaymentData = useCallback(() => {
    setIsLoading(true);
    const records = getAllMockPayments();
    records.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    setPayments(records);
    setIsLoading(false);
  }, []);

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
    <div className="flex justify-center">
      <Card className="shadow-md mt-6 w-full max-w-6xl">
        <CardHeader>
          <CardTitle>All Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
           <ScrollArea className="h-[calc(100vh-12rem)] w-full"> 
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Amount Paid (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No payment records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.customerName}</TableCell>
                      <TableCell>{format(new Date(payment.paymentDate), 'PP')}</TableCell>
                      <TableCell>{format(new Date(payment.paymentDate), 'p')}</TableCell>
                      <TableCell className="text-right">{payment.amountPaid.toLocaleString('en-US')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
