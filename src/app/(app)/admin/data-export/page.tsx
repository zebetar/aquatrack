
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileDown, CalendarIcon, Search, Download, Droplets } from 'lucide-react';
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
import { getAllCustomers, getUsageRecordsByCustomerId, getPaymentsByCustomerId } from '@/lib/firebase-service';


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
    const fetchCustomers = async () => {
        setIsLoadingCustomers(true);
        try {
            const allCustomers = await getAllCustomers();
            setCustomers(allCustomers.sort((a,b) => a.name.localeCompare(b.name)));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load customers.' });
        } finally {
            setIsLoadingCustomers(false);
        }
    };
    fetchCustomers();
  }, [toast]);

  const handleDataExport = (dataType: string, formatType: string) => {
    toast({
      title: "Coming Soon!",
      description: `Exporting ${dataType} to ${formatType} is not yet implemented.`,
    });
  };

  const handleDownloadAllData = () => {
    toast({
      title: "Coming Soon!",
      description: `A full data backup feature will be available in a future update.`,
    });
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

    try {
        const endOfDayEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
        
        const usageData = (await getUsageRecordsByCustomerId(selectedCustomerId)).filter(r => 
          new Date(r.startTime) >= startDate && new Date(r.startTime) <= endOfDayEndDate
        );
        setFilteredUsage(usageData);

        const paymentData = (await getPaymentsByCustomerId(selectedCustomerId)).filter(p => 
          new Date(p.paymentDate) >= startDate && new Date(p.paymentDate) <= endOfDayEndDate
        );
        setFilteredPayments(paymentData);
          
        setShowPreview(true);
        if (usageData.length === 0 && paymentData.length === 0) {
            toast({ title: "No Data Found", description: "No usage or payment records found for the selected criteria and date range." });
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch data for preview." });
    } finally {
        setIsPreviewing(false);
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

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) {
      toast({ variant: "destructive", title: "Error", description: "Could not find selected customer." });
      return;
    }

    setIsDownloading(true);
    
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
    <div className="mt-6">
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
                    {isPreviewing && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
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
                  <ScrollArea className="h-[200px] border rounded-md w-full">
                    <Table className="min-w-[600px]">
                      <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Time Range</TableHead><TableHead>Duration</TableHead><TableHead className="text-right">Cost (PKR)</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filteredUsage.map(r => (
                          <TableRow key={r.id}>
                            <TableCell>{format(new Date(r.date), 'PP')}</TableCell>
                            <TableCell>{`${format(new Date(r.startTime), 'p')} - ${format(new Date(r.endTime), 'p')}`}</TableCell>
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
                  <ScrollArea className="h-[200px] border rounded-md w-full">
                    <Table className="min-w-[500px]">
                      <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead className="text-right">Amount (PKR)</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filteredPayments.map(p => (
                          <TableRow key={p.id}>
                            <TableCell>{format(new Date(p.paymentDate), 'PP')}</TableCell>
                            <TableCell>{format(new Date(p.paymentDate), 'p')}</TableCell>
                            <TableCell className="text-right">{p.amountPaid.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : <p className="text-sm text-muted-foreground">No payment records found for this period.</p>}
              </div>
              <Button onClick={handleDownloadFilteredPdf} disabled={isDownloading || (!filteredUsage.length && !filteredPayments.length) || !selectedCustomerId || !startDate || !endDate} className="w-full sm:w-auto">
                {isDownloading && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
                <Download className="mr-2 h-4 w-4" /> Download Filtered PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
