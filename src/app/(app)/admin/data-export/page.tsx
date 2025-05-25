
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Users, Droplets, CreditCard, DatabaseZap, CalendarIcon, Search, Download, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { exportMockDataAsJSON, getAllMockCustomers, getMockCustomerById, getMockUsageRecordsByCustomerId, getMockPaymentsByCustomerId } from '@/lib/mock-data-store';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateCustomerPdf } from '@/lib/generate-customer-pdf';
import { cn, formatDurationFromHours } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


export default function DataExportPage() {
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
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
    if (!selectedCustomerId || !startDate || !endDate) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select a customer, start date, and end date." });
      return;
    }
    if (endDate < startDate) {
      toast({ variant: "destructive", title: "Invalid Date Range", description: "End date cannot be before start date." });
      return;
    }

    setIsPreviewing(true);
    setShowPreview(false);

    await new Promise(resolve => setTimeout(resolve, 300));

    const endOfDayEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);

    const usage = getMockUsageRecordsByCustomerId(selectedCustomerId)
      .filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endOfDayEndDate;
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const payments = getMockPaymentsByCustomerId(selectedCustomerId)
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate >= startDate && paymentDate <= endOfDayEndDate;
      })
      .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    setFilteredUsage(usage);
    setFilteredPayments(payments);
    setIsPreviewing(false);
    setShowPreview(true);
    if (usage.length === 0 && payments.length === 0) {
        toast({ title: "No Data Found", description: "No usage or payment records found for the selected criteria and date range." });
    }
  };

  const handleDownloadFilteredPdf = async () => {
    if (!selectedCustomerId || !startDate || !endDate) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select a customer, start date, and end date to download PDF." });
      return;
    }
    if (endDate < startDate) {
      toast({ variant: "destructive", title: "Invalid Date Range", description: "End date cannot be before start date." });
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
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      await generateCustomerPdf(customer, filteredUsage, filteredPayments);
      toast({
        title: "PDF Generated",
        description: `Statement for ${customer.name} (from ${format(startDate, 'PP')} to ${format(endDate, 'PP')}) is being downloaded.`,
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
      <Button variant="outline" asChild className="mb-6 mt-6">
        <Link href="/admin/settings">
          <>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </>
        </Link>
      </Button>

      <Card className="glassmorphism-card shadow-md mb-6">
        <CardHeader>
          <CardTitle>Customer Data (PDF)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="start-date-picker" className="text-sm font-medium">Start Date</Label>
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
                      disabled={(date) => date > new Date() || (endDate && date > endDate)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end-date-picker" className="text-sm font-medium">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date-picker"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => date > new Date() || (startDate && date < startDate)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
                <Button onClick={handlePreviewFilteredData} disabled={isPreviewing || !selectedCustomerId || !startDate || !endDate} className="w-full sm:w-auto">
                    {isPreviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Search className="mr-2 h-4 w-4" /> Preview Data
                </Button>
            </div>
          </div>

          {showPreview && (selectedCustomerId && startDate && endDate) && (
            <div className="mt-6 space-y-6">
              <h3 className="text-lg font-semibold">Preview for {customers.find(c=>c.id === selectedCustomerId)?.name} (from {format(startDate, 'PP')} to {format(endDate, 'PP')})</h3>

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
              <Button onClick={handleDownloadFilteredPdf} disabled={isDownloading || (!filteredUsage.length && !filteredPayments.length) || !selectedCustomerId || !startDate || !endDate} className="w-full sm:w-auto">
                {isDownloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Download className="mr-2 h-4 w-4" /> Download Filtered PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glassmorphism-card shadow-md mb-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="general-export" className="border-none">
            <CardHeader className="p-4">
                <AccordionTrigger className="p-0 hover:no-underline">
                    <CardTitle>General Export Options</CardTitle>
                </AccordionTrigger>
            </CardHeader>
            <AccordionContent>
              <CardContent className="space-y-6 p-4 pt-0">
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 border rounded-lg bg-card/80">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="font-semibold text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Customer Data</h3>
                    <p className="text-sm text-muted-foreground">Simulate exporting a list of all customers and their details.</p>
                  </div>
                  <Button onClick={() => handleMockExport("All Customer", "CSV")} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" /> Export as CSV (Mock)
                  </Button>
                </div>

                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 border rounded-lg bg-card/80">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="font-semibold text-lg flex items-center"><Droplets className="mr-2 h-5 w-5 text-primary"/>Water Usage Records</h3>
                    <p className="text-sm text-muted-foreground">Simulate exporting all logged water usage records.</p>
                  </div>
                  <Button onClick={() => handleMockExport("All Water Usage", "CSV")} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" /> Export as CSV (Mock)
                  </Button>
                </div>

                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 border rounded-lg bg-card/80">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="font-semibold text-lg flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Payment Histories</h3>
                    <p className="text-sm text-muted-foreground">Simulate exporting all recorded payment transactions.</p>
                  </div>
                  <Button onClick={() => handleMockExport("All Payment Histories", "CSV")} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" /> Export as CSV (Mock)
                  </Button>
                </div>

                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 border rounded-lg bg-card/80">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="font-semibold text-lg flex items-center"><DatabaseZap className="mr-2 h-5 w-5 text-primary"/>Download Mock Data Backup</h3>
                    <p className="text-sm text-muted-foreground">Download all current data from localStorage as a single JSON file. This is useful for backup or migration.</p>
                  </div>
                  <Button onClick={handleDownloadAllMockData} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" /> Download localStorage Data
                  </Button>
                </div>
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </>
  );
}

    