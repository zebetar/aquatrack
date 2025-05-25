
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Users, Droplets, CreditCard, DatabaseZap, CalendarIcon, Search, Download, Loader2 } from 'lucide-react'; 
import Link from 'next/link';
import { exportMockDataAsJSON, getAllMockCustomers, getMockCustomerById, getMockUsageRecordsByCustomerId, getMockPaymentsByCustomerId } from '@/lib/mock-data-store';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateCustomerPdf } from '@/lib/generate-customer-pdf';
import { cn, formatDurationFromHours } from '@/lib/utils';

export default function DataExportPage() {
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [filteredUsage, setFilteredUsage] = useState<WaterUsageRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setIsLoadingCustomers(true);
    const allCustomers = getAllMockCustomers();
    setCustomers(allCustomers.sort((a,b) => a.name.localeCompare(b.name)));
    setIsLoadingCustomers(false);
  }, []);

  const handleMockExport = (dataType: string, formatType: string) => {
    toast({
      title: "Export Initiated (Mock)",
      description: `${dataType} data export to ${formatType} has started. (This is a mock action)`,
    });
  };

  const handleDownloadAllMockData = () => {
    try {
      const jsonData = exportMockDataAsJSON();
      if (jsonData === "{\n  \"customers\": [],\n  \"usageRecords\": [],\n  \"payments\": [],\n  \"notifications\": []\n}") {
         toast({
          variant: "default",
          title: "No Data to Export",
          description: "The mock data store is currently empty.",
        });
        return;
      }
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aquatrack_mock_data_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Mock Data Exported",
        description: "All current mock data from localStorage has been downloaded as a JSON file.",
      });
    } catch (error) {
      console.error("Error exporting mock data:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not export the mock data.",
      });
    }
  };

  const handlePreviewFilteredData = async () => {
    if (!selectedCustomerId || !startDate) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select a customer and a start date." });
      return;
    }
    setIsPreviewing(true);
    setShowPreview(false); // Reset preview visibility

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const usage = getMockUsageRecordsByCustomerId(selectedCustomerId)
      .filter(record => new Date(record.date) >= startDate)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const payments = getMockPaymentsByCustomerId(selectedCustomerId)
      .filter(payment => new Date(payment.paymentDate) >= startDate)
      .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    setFilteredUsage(usage);
    setFilteredPayments(payments);
    setIsPreviewing(false);
    setShowPreview(true);
    if (usage.length === 0 && payments.length === 0) {
        toast({ title: "No Data Found", description: "No usage or payment records found for the selected criteria." });
    }
  };

  const handleDownloadFilteredPdf = async () => {
    if (!selectedCustomerId || !startDate) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select a customer and a start date to download PDF." });
      return;
    }
    if (filteredUsage.length === 0 && filteredPayments.length === 0 && !showPreview) {
        toast({ variant: "destructive", title: "No Data Previewed", description: "Please preview data first or ensure records exist for the selected criteria." });
        return;
    }

    const customer = getMockCustomerById(selectedCustomerId);
    if (!customer) {
      toast({ variant: "destructive", title: "Error", description: "Could not find selected customer." });
      return;
    }

    setIsDownloading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate PDF generation time

    try {
      await generateCustomerPdf(customer, filteredUsage, filteredPayments); // Pass filtered records
      toast({
        title: "PDF Generated",
        description: `Statement for ${customer.name} (from ${format(startDate, 'PP')}) is being downloaded.`,
      });
    } catch (error) {
      console.error("Error generating filtered PDF:", error);
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "Could not generate the PDF statement.",
      });
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <>
      <PageHeader
        title="Data Export & Management"
        description="Manage and export application data."
      />
      <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/settings">Back to Settings</Link>
      </Button>

      <Card className="glassmorphism-card shadow-md mb-6">
        <CardHeader>
          <CardTitle>Filtered Customer Data Export (PDF)</CardTitle>
          <CardDescription>
            Select a customer and a start date to preview and download their usage and payment history from that date onwards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 items-end">
            <div className="space-y-1.5">
              <label htmlFor="customer-select" className="text-sm font-medium">Select Customer</label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer-select" className="w-full" disabled={isLoadingCustomers}>
                  <SelectValue placeholder={isLoadingCustomers ? "Loading customers..." : "Select a customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="start-date-picker" className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date-picker"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handlePreviewFilteredData} disabled={isPreviewing || !selectedCustomerId || !startDate} className="w-full sm:w-auto">
              {isPreviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Search className="mr-2 h-4 w-4" /> Preview Data
            </Button>
          </div>

          {showPreview && (selectedCustomerId && startDate) && (
            <div className="mt-6 space-y-6">
              <Separator />
              <h3 className="text-lg font-semibold">Preview for {customers.find(c=>c.id === selectedCustomerId)?.name} (from {format(startDate, 'PP')})</h3>
              
              <div>
                <h4 className="text-md font-medium mb-2">Filtered Water Usage</h4>
                {filteredUsage.length > 0 ? (
                  <ScrollArea className="h-[200px] border rounded-md">
                    <Table>
                      <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Duration</TableHead><TableHead className="text-right">Cost (PKR)</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filteredUsage.map(r => (
                          <TableRow key={r.id}>
                            <TableCell>{format(new Date(r.date), 'PP')}</TableCell>
                            <TableCell>{formatDurationFromHours(r.durationHours)}</TableCell>
                            <TableCell className="text-right">{r.cost.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : <p className="text-sm text-muted-foreground">No usage records found for this period.</p>}
              </div>

              <div>
                <h4 className="text-md font-medium mb-2">Filtered Payments</h4>
                 {filteredPayments.length > 0 ? (
                  <ScrollArea className="h-[200px] border rounded-md">
                    <Table>
                      <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount (PKR)</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filteredPayments.map(p => (
                          <TableRow key={p.id}>
                            <TableCell>{format(new Date(p.paymentDate), 'PP p')}</TableCell>
                            <TableCell className="text-right">{p.amountPaid.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : <p className="text-sm text-muted-foreground">No payment records found for this period.</p>}
              </div>
              <Separator />
              <Button onClick={handleDownloadFilteredPdf} disabled={isDownloading || (!filteredUsage.length && !filteredPayments.length)} className="w-full sm:w-auto">
                {isDownloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Download className="mr-2 h-4 w-4" /> Download Filtered PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glassmorphism-card shadow-md mb-6">
        <CardHeader>
          <CardTitle>General Export Options</CardTitle>
          <CardDescription>
            Simulate other export types or download a full backup of current mock data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Customer Data</h3>
              <p className="text-sm text-muted-foreground">Simulate exporting a list of all customers and their details.</p>
            </div>
            <Button onClick={() => handleMockExport("All Customer", "CSV")} variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export as CSV (Mock)
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><Droplets className="mr-2 h-5 w-5 text-primary"/>Water Usage Records</h3>
              <p className="text-sm text-muted-foreground">Simulate exporting all logged water usage records.</p>
            </div>
            <Button onClick={() => handleMockExport("All Water Usage", "CSV")} variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export as CSV (Mock)
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Payment Histories</h3>
              <p className="text-sm text-muted-foreground">Simulate exporting all recorded payment transactions.</p>
            </div>
            <Button onClick={() => handleMockExport("All Payment Histories", "CSV")} variant="outline">
               <FileDown className="mr-2 h-4 w-4" /> Export as CSV (Mock)
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><DatabaseZap className="mr-2 h-5 w-5 text-primary"/>Download Mock Data Backup</h3>
              <p className="text-sm text-muted-foreground">Download all current data from localStorage as a single JSON file. This is useful for backup or migration.</p>
            </div>
            <Button onClick={handleDownloadAllMockData} variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Download localStorage Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

