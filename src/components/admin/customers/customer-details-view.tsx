
"use client";

import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil, Droplets, CreditCard } from 'lucide-react';
import { EditUsageRecordDialog } from './edit-usage-record-dialog';
import { EditPaymentRecordDialog } from './edit-payment-record-dialog';
import { formatDurationFromHours } from '@/lib/utils';

interface CustomerDetailsViewProps {
  customer: Customer;
  usageRecords: WaterUsageRecord[];
  payments: Payment[];
  onUsageRecordUpdated: (updatedRecord: WaterUsageRecord) => void;
  onPaymentRecordUpdated: (updatedPayment: Payment) => void;
}


export function CustomerDetailsView({ 
  customer, 
  usageRecords, 
  payments,
  onUsageRecordUpdated,
  onPaymentRecordUpdated
}: CustomerDetailsViewProps) {
  return (
    <div className="space-y-6">
      {/* Customer Information section has been removed and moved to User Management */}

      <Card className="glassmorphism-card">
        <CardHeader>
          <CardTitle>Water Usage History</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile List View */}
          <div className="space-y-0 md:hidden">
            {usageRecords.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No usage records found.</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {usageRecords.map(record => (
                  <li key={record.id} className="flex items-center gap-3 py-4 px-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Droplets className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-baseline justify-between">
                            <p className="font-semibold text-foreground">PKR {record.cost.toLocaleString('en-US')}</p>
                            <p className="text-xs text-muted-foreground">{formatDurationFromHours(record.durationHours)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(record.date), 'MMM d, yyyy')} &bull; {`${format(new Date(record.startTime), 'p')} - ${format(new Date(record.endTime), 'p')}`}
                        </p>
                    </div>
                    <EditUsageRecordDialog
                      usageRecord={record}
                      onUsageRecordUpdated={onUsageRecordUpdated}
                      triggerButton={<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2"><Pencil className="h-4 w-4" /></Button>}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Desktop Table View */}
          <ScrollArea className="hidden h-[300px] w-full md:block">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time Range</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Cost (PKR)</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No usage records found.</TableCell></TableRow>
                ) : (
                  usageRecords.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                      <TableCell>{`${format(new Date(record.startTime), 'p')} - ${format(new Date(record.endTime), 'p')}`}</TableCell>
                      <TableCell className="text-right">{formatDurationFromHours(record.durationHours)}</TableCell>
                      <TableCell className="text-right">{record.cost.toLocaleString('en-US')}</TableCell>
                      <TableCell className="text-center">
                        <EditUsageRecordDialog 
                          usageRecord={record} 
                          onUsageRecordUpdated={onUsageRecordUpdated} 
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="glassmorphism-card">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
           {/* Mobile List View */}
           <div className="space-y-0 md:hidden">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No payment records found.</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {payments.map(payment => (
                  <li key={payment.id} className="flex items-center gap-3 py-4 px-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 dark:bg-green-500/20">
                        <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="font-semibold text-green-600 dark:text-green-500">PKR {payment.amountPaid.toLocaleString('en-US')}</p>
                        <p className="text-sm text-muted-foreground">
                            Payment on {format(new Date(payment.paymentDate), 'PP p')}
                        </p>
                    </div>
                     <EditPaymentRecordDialog
                        paymentRecord={payment}
                        onPaymentRecordUpdated={onPaymentRecordUpdated}
                        triggerButton={<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2"><Pencil className="h-4 w-4" /></Button>}
                      />
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Desktop Table View */}
          <ScrollArea className="hidden h-[300px] w-full md:block">
            <Table className="min-w-[550px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Amount Paid (PKR)</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">No payment records found.</TableCell></TableRow>
                ) : (
                  payments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.paymentDate), 'PP')}</TableCell>
                      <TableCell>{format(new Date(payment.paymentDate), 'p')}</TableCell>
                      <TableCell className="text-right">{payment.amountPaid.toLocaleString('en-US')}</TableCell>
                      <TableCell className="text-center">
                        <EditPaymentRecordDialog 
                          paymentRecord={payment} 
                          onPaymentRecordUpdated={onPaymentRecordUpdated} 
                        />
                      </TableCell>
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
