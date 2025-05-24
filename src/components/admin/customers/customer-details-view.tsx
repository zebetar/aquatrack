
"use client";

import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { CORE_WATER_RATE_PER_HOUR } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Save, XCircle } from 'lucide-react';

interface CustomerDetailsViewProps {
  customer: Customer;
  usageRecords: WaterUsageRecord[];
  payments: Payment[];
  isEditing: boolean;
  editedCustomerData: Partial<Customer>; // Or Customer if all fields are always present
  onFieldChange: (field: keyof Customer, value: string) => void;
  onToggleEdit: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
}

export function CustomerDetailsView({ 
  customer, 
  usageRecords, 
  payments,
  isEditing,
  editedCustomerData,
  onFieldChange,
  onToggleEdit,
  onSaveChanges,
  onCancelChanges 
}: CustomerDetailsViewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Customer Information</CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={onToggleEdit}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="default" size="sm" onClick={onSaveChanges}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelChanges}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {isEditing ? (
            <>
              <div className="space-y-1">
                <Label htmlFor="customerName">Name</Label>
                <Input 
                  id="customerName" 
                  value={editedCustomerData.name || ''} 
                  onChange={(e) => onFieldChange('name', e.target.value)} 
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customerContact">Contact Info</Label>
                <Input 
                  id="customerContact" 
                  value={editedCustomerData.contactInfo || ''} 
                  onChange={(e) => onFieldChange('contactInfo', e.target.value)} 
                />
              </div>
               <div className="space-y-1">
                <Label htmlFor="customerEmail">Email (for Viewer Login)</Label>
                <Input 
                  id="customerEmail" 
                  type="email"
                  value={editedCustomerData.email || ''} 
                  onChange={(e) => onFieldChange('email', e.target.value)} 
                />
              </div>
              <div>
                <span className="font-semibold text-sm">Joined:</span> {format(new Date(customer.createdAt), 'PPP')}
              </div>
              <div>
                <span className="font-semibold text-sm">Current Balance:</span> PKR {customer.balance.toLocaleString('en-US')}
              </div>
              {customer.authUID && <div><span className="font-semibold text-sm">Linked Auth UID:</span> {customer.authUID}</div>}
            </>
          ) : (
            <>
              <div><span className="font-semibold">Name:</span> {customer.name}</div>
              <div><span className="font-semibold">Contact:</span> {customer.contactInfo || 'N/A'}</div>
              <div><span className="font-semibold">Email:</span> {customer.email || 'N/A'}</div>
              <div><span className="font-semibold">Joined:</span> {format(new Date(customer.createdAt), 'PPP')}</div>
              <div><span className="font-semibold">Current Balance:</span> PKR {customer.balance.toLocaleString('en-US')}</div>
              {customer.authUID && <div><span className="font-semibold">Linked Auth UID:</span> {customer.authUID}</div>}
            </>
          )}
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
                  // Ensure no extraneous whitespace between TableCell components within TableRow
                  <TableRow key={payment.id}
                    ><TableCell>{format(new Date(payment.paymentDate), 'PP p')}</TableCell
                    ><TableCell className="text-right">{payment.amountPaid.toLocaleString('en-US')}</TableCell
                    ><TableCell>{payment.recordedBy === 'admin001' ? "Admin" : payment.recordedBy}</TableCell
                  ></TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
