
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
import { formatDurationFromHours } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from "@/lib/utils";
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CustomerWithUsage extends Customer {
  totalUsageHours?: number;
}

interface CustomerListTableProps {
  customers: CustomerWithUsage[];
  onCustomerDeleted: (customerId: string) => void;
  deletingCustomerId: string | null;
  enableActions?: boolean;
  className?: string;
}

export function CustomerListTable({
  customers,
  onCustomerDeleted,
  deletingCustomerId,
  enableActions = false,
  className
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

  const numberOfColumns = enableActions ? 5 : 4;

  return (
    <>
      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {customers.length === 0 ? (
          <Card className="text-center glassmorphism-card">
            <CardContent className="py-12">
              <p className="text-muted-foreground">No customers found.</p>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id} className="glassmorphism-card" onClick={() => handleRowClick(customer.id)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{customer.name}</h3>
                    <Badge variant={customer.balance > 0 ? "destructive" : customer.balance < 0 ? "secondary" : "default"}>
                      {customer.balance > 0 ? "Due" : customer.balance < 0 ? "Credit" : "Settled"}
                    </Badge>
                  </div>
                  {enableActions && (
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
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 hover:bg-destructive/20"
                        >
                          {deletingCustomerId === customer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-destructive" />}
                        </Button>
                      }
                    />
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Balance</p>
                    <p className="font-medium">PKR {customer.balance.toLocaleString('en-US')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Usage</p>
                    <p className="font-medium">{formatDurationFromHours(customer.totalUsageHours ?? 0)}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    title="Download Statement PDF"
                    onClick={(e) => handleDownloadPdf(e, customer)}
                    disabled={generatingPdfId === customer.id}
                  >
                    {generatingPdfId === customer.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4 text-primary" />
                    )}
                    Download Statement
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <ScrollArea
        className={cn(
          "hidden w-full rounded-lg border bg-card shadow-sm glassmorphism-card md:block",
          className
        )}
      >
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Total Usage</TableHead>
              <TableHead className="text-right">Balance (PKR)</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">PDF</TableHead>
              {enableActions && <TableHead className="text-center">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={numberOfColumns + (enableActions ? 1 : 0)} className="h-24 text-center">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  onClick={() => handleRowClick(customer.id)}
                  className="cursor-pointer hover:bg-muted/60"
                >
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="text-right">{formatDurationFromHours(customer.totalUsageHours ?? 0)}</TableCell>
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
                            onClick={(e) => e.stopPropagation()}
                            className="hover:bg-destructive/20"
                          >
                            {deletingCustomerId === customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                          </Button>
                        }
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </>
  );
}
