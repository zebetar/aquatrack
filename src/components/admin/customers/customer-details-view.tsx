
"use client";

import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Save, XCircle, Pencil, Droplets, CreditCard } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EditUsageRecordDialog } from './edit-usage-record-dialog';
import { EditPaymentRecordDialog } from './edit-payment-record-dialog';
import { formatDurationFromHours } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface CustomerDetailsViewProps {
  customer: Customer;
  usageRecords: WaterUsageRecord[];
  payments: Payment[];
  isEditing: boolean;
  editedCustomerData: Partial<Customer>;
  onFieldChange: (field: keyof Customer, value: string) => void;
  onToggleEdit: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  onUsageRecordUpdated: (updatedRecord: WaterUsageRecord) => void;
  onPaymentRecordUpdated: (updatedPayment: Payment) => void;
}

const DetailItem = ({ label, value, isEditing = false, id, field, editedValue, onChange, inputType = "text" }: {
  label: string;
  value?: string | number | null;
  isEditing?: boolean;
  id?: string;
  field?: keyof Customer;
  editedValue?: string;
  onChange?: (value: string) => void;
  inputType?: string;
}) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">{label}</Label>
    {isEditing && id && field && onChange ? (
      <Input
        id={id}
        type={inputType}
        value={editedValue || ''}
        onChange={(e) => onChange(e.target.value)}
        className="text-base"
      />
    ) : (
      <p className="text-base font-medium">{value || 'N/A'}</p>
    )}
  </div>
);


export function CustomerDetailsView({ 
  customer, 
  usageRecords, 
  payments,
  isEditing,
  editedCustomerData,
  onFieldChange,
  onToggleEdit,
  onSaveChanges,
  onCancelChanges,
  onUsageRecordUpdated,
  onPaymentRecordUpdated
}: CustomerDetailsViewProps) {
  return (
    <div className="space-y-6">
      <Card className="glassmorphism-card">
        <Accordion type="single" collapsible defaultChecked={false}>
          <AccordionItem value="customer-info" className="border-none">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <AccordionTrigger className="flex-1 py-0 hover:no-underline">
                <CardTitle className="text-xl">Customer Information</CardTitle>
              </AccordionTrigger>
              {!isEditing ? (
                <Button variant="ghost" size="icon" onClick={onToggleEdit} className="ml-4 rounded-full h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-2 ml-4">
                  <Button variant="default" size="icon" onClick={onSaveChanges} className="rounded-full h-8 w-8">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onCancelChanges} className="rounded-full h-8 w-8">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <AccordionContent>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4 pt-0">
                <DetailItem
                  label="Name"
                  value={customer.name}
                  isEditing={isEditing}
                  id="customerName"
                  field="name"
                  editedValue={editedCustomerData.name}
                  onChange={(value) => onFieldChange('name', value)}
                />
                <DetailItem
                  label="Contact Info (Phone/Address)"
                  value={customer.contactInfo}
                  isEditing={isEditing}
                  id="customerContact"
                  field="contactInfo"
                  editedValue={editedCustomerData.contactInfo}
                  onChange={(value) => onFieldChange('contactInfo', value)}
                />
                <DetailItem
                  label="Email (for Viewer Login)"
                  value={customer.email}
                  isEditing={isEditing}
                  id="customerEmail"
                  field="email"
                  editedValue={editedCustomerData.email}
                  onChange={(value) => onFieldChange('email', value)}
                  inputType="email"
                />
                <DetailItem
                  label="Joined On"
                  value={format(new Date(customer.createdAt), 'PPP')}
                />
                <DetailItem
                  label="Current Balance"
                  value={`PKR ${customer.balance.toLocaleString('en-US')}`}
                />
                {customer.authUID && (
                  <DetailItem
                    label="Linked Auth UID"
                    value={customer.authUID}
                  />
                )}
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

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
