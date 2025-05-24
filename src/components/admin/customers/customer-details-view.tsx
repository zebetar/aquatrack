"use client";

import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { CORE_WATER_RATE_PER_HOUR } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CustomerDetailsViewProps {
  customer: Customer;
  usageRecords: WaterUsageRecord[];
  payments: Payment[];
}

export function CustomerDetailsView({ customer, usageRecords, payments }: CustomerDetailsViewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <div><span className="font-semibold">Name:</span> {customer.name}</div>
          <div><span className="font-semibold">Contact:</span> {customer.contactInfo || 'N/A'}</div>
          <div><span className="font-semibold">Joined:</span> {format(new Date(customer.createdAt), 'PPP')}</div>
          <div><span className="font-semibold">Current Balance:</span> PKR {customer.balance.toLocaleString('en-US')}</div>
           {customer.authUID && <div><span className="font-semibold">Linked Auth UID:</span> {customer.authUID}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Water Usage History</CardTitle>
          <CardDescription>Core rate: PKR {CORE_WATER_RATE_PER_HOUR}/hour</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="text-right">Duration (Hrs)</TableHead>
                  <TableHead className="text-right">Cost (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageRecords.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No usage records found.</TableCell></TableRow>
                )}
                {usageRecords.map(record => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                    <TableCell>{format(new Date(record.startTime), 'p')}</TableCell>
                    <TableCell>{format(new Date(record.endTime), 'p')}</TableCell>
                    <TableCell className="text-right">{record.durationHours.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{record.cost.toLocaleString('en-US')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="text-right">Amount Paid (PKR)</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">No payment records found.</TableCell></TableRow>
                )}
                {payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.paymentDate), 'PP p')}</TableCell>
                    <TableCell className="text-right">{payment.amountPaid.toLocaleString('en-US')}</TableCell>
                    <TableCell>{payment.recordedBy === 'admin001' ? "Admin" : payment.recordedBy}</TableCell> {/* Placeholder for recorder name */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
