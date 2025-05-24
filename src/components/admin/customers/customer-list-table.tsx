
"use client";

import type { Customer } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Download, Loader2, Trash2 } from 'lucide-react';
import { generateCustomerPdf } from '@/lib/generate-customer-pdf';
import { getMockUsageRecordsByCustomerId, getMockPaymentsByCustomerId } from '@/lib/mock-data-store';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { DeleteCustomerDialog } from './delete-customer-dialog';

// Expect an optional totalUsageHours property
interface CustomerWithUsage extends Customer {
  totalUsageHours?: number;
}

interface CustomerListTableProps {
  customers: CustomerWithUsage[];
  onCustomerDeleted: (customerId: string) => void; 
  deletingCustomerId: string | null;
  enableActions?: boolean; 
}

export function CustomerListTable({ 
  customers, 
  onCustomerDeleted, 
  deletingCustomerId,
  enableActions = false 
}: CustomerListTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const handleDownloadPdf = async (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation(); 
    setGeneratingPdfId(customer.id);
    try {
      const usageRecords = getMockUsageRecordsByCustomerId(customer.id);
      const payments = getMockPaymentsByCustomerId(customer.id);
      await generateCustomerPdf(customer, usageRecords, payments);
      toast({
        title: "PDF Generated",
        description: `Statement for ${customer.name} is being downloaded.`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "Could not generate the PDF statement.",
      });
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleRowClick = (customerId: string) => {
    router.push(`/admin/customers/${customerId}`);
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm glassmorphism-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead className="text-right">Total Usage (Hrs)</TableHead>
            <TableHead className="text-right">Balance (PKR)</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">PDF</TableHead>
            {enableActions && <TableHead className="text-center">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={enableActions ? 7 : 6} className="h-24 text-center">
                No customers found.
              </TableCell>
            </TableRow>
          )}
          {customers.map((customer) => (
            <TableRow 
              key={customer.id} 
              onClick={() => handleRowClick(customer.id)}
              className="cursor-pointer hover:bg-muted/60"
            >
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>{customer.contactInfo || '-'}</TableCell>
              <TableCell className="text-right">{(customer.totalUsageHours ?? 0).toFixed(1)}</TableCell>
              <TableCell className="text-right">{customer.balance.toLocaleString('en-US')}</TableCell>
              <TableCell className="text-center">
                <Badge variant={customer.balance > 0 ? "destructive" : customer.balance < 0 ? "secondary" : "default"}>
                  {customer.balance > 0 ? "Due" : customer.balance < 0 ? "Credit" : "Settled"}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Download Statement PDF"
                  onClick={(e) => handleDownloadPdf(e, customer)}
                  disabled={generatingPdfId === customer.id}
                  className="hover:bg-primary/20"
                >
                  {generatingPdfId === customer.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 text-primary" />
                  )}
                </Button>
              </TableCell>
              {enableActions && (
                <TableCell className="text-center">
                  <DeleteCustomerDialog 
                    customer={customer}
                    onDeleteConfirm={() => onCustomerDeleted(customer.id)}
                    isDeleting={deletingCustomerId === customer.id}
                    triggerButton={
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Delete Customer" 
                        disabled={deletingCustomerId === customer.id}
                        onClick={(e) => e.stopPropagation()} // Prevent row click
                        className="hover:bg-destructive/20"
                      >
                        {deletingCustomerId === customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                      </Button>
                    }
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
