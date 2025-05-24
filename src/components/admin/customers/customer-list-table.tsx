
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
import Link from 'next/link';
import { Eye, Download, Loader2 } from 'lucide-react';
// import { format } from 'date-fns'; // No longer needed for 'Joined On'
import { generateCustomerPdf } from '@/lib/generate-customer-pdf';
import { getMockUsageRecordsByCustomerId, getMockPaymentsByCustomerId } from '@/lib/mock-data-store';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface CustomerListTableProps {
  customers: Customer[];
}

export function CustomerListTable({ customers }: CustomerListTableProps) {
  const { toast } = useToast();
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const handleDownloadPdf = async (customer: Customer) => {
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

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact Info</TableHead>
            {/* <TableHead>Joined On</TableHead> -- Removed */}
            <TableHead className="text-right">Balance (PKR)</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center"> {/* Adjusted colSpan from 6 to 5 */}
                No customers found.
              </TableCell>
            </TableRow>
          )}
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>{customer.contactInfo || '-'}</TableCell>
              {/* <TableCell>{format(new Date(customer.createdAt), 'PP')}</TableCell> -- Removed */}
              <TableCell className="text-right">{customer.balance.toLocaleString('en-US')}</TableCell>
              <TableCell className="text-center">
                <Badge variant={customer.balance > 0 ? "destructive" : customer.balance < 0 ? "secondary" : "default"}>
                  {customer.balance > 0 ? "Due" : customer.balance < 0 ? "Credit" : "Settled"}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="icon" asChild title="View Details">
                  <Link href={`/admin/customers/${customer.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Download Statement PDF"
                  onClick={() => handleDownloadPdf(customer)}
                  disabled={generatingPdfId === customer.id}
                >
                  {generatingPdfId === customer.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
