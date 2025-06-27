
"use client";

import type { Payment } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

interface PaymentListProps {
  payments: Payment[];
}

export function PaymentList({ payments }: PaymentListProps) {
  if (payments.length === 0) {
    return (
      <Card className="text-center glassmorphism-card">
        <CardContent className="py-12">
          <p className="text-muted-foreground">No payment records found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {payments.map((payment) => (
          <Card key={payment.id} className="glassmorphism-card">
            <CardContent className="p-4">
              <div className="flex items-baseline justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold truncate">{payment.customerName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(payment.paymentDate), 'PP p')}
                  </p>
                </div>
                <p className="font-semibold text-lg text-primary whitespace-nowrap">PKR {payment.amountPaid.toLocaleString('en-US')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden shadow-md glassmorphism-card md:block">
        <ScrollArea className="h-[calc(100vh-16rem)] w-full"> 
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
              {payments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.customerName}</TableCell>
                  <TableCell>{format(new Date(payment.paymentDate), 'PP')}</TableCell>
                  <TableCell>{format(new Date(payment.paymentDate), 'p')}</TableCell>
                  <TableCell className="text-right">{payment.amountPaid.toLocaleString('en-US')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </>
  );
}
