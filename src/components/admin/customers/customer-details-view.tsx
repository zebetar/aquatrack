
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  <div className="space-y-1 py-2">
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
  onCancelChanges 
}: CustomerDetailsViewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <Accordion type="single" collapsible className="w-full"> {/* Removed defaultValue */}
          <AccordionItem value="customer-info">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <AccordionTrigger className="flex-1 py-0">
                <CardTitle className="text-xl">Customer Information</CardTitle>
              </AccordionTrigger>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={onToggleEdit} className="ml-4">
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2 ml-4">
                  <Button variant="default" size="sm" onClick={onSaveChanges}>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onCancelChanges}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <AccordionContent>
              <CardContent className="space-y-2 p-4 pt-0">
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
                    <TableCell>{payment.recordedBy === 'admin001' ? "Admin" : payment.recordedBy}</TableCell>
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
