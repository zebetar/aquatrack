
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    // Sort by most recent first
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
    <>
      <PageHeader 
        title="Payment Management" 
        description="Track and record all customer payments."
      />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>All Payment Records</CardTitle>
           <CardDescription>Review all payments recorded in the system.</CardDescription>
        </CardHeader>
        <CardContent>
           <ScrollArea className="h-[calc(100vh-18rem)] w-full"> {/* Adjust height as needed */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="text-right">Amount Paid (PKR)</TableHead>
                  <TableHead>Recorded By</TableHead>
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
                      <TableCell>{format(new Date(payment.paymentDate), 'PP p')}</TableCell>
                      <TableCell className="text-right">{payment.amountPaid.toLocaleString('en-US')}</TableCell>
                      <TableCell>{payment.recordedBy === 'admin001' ? 'Admin' : payment.recordedBy}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
