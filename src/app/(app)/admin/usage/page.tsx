
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WaterUsageRecord } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { getAllMockUsageRecords } from '@/lib/mock-data-store';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { formatDurationFromHours } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsagePage() {
  const [usageRecords, setUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadUsageData = useCallback(() => {
    setIsLoading(true);
    try {
      const records = getAllMockUsageRecords();
      setUsageRecords(records);
    } catch(error) {
       console.error("Failed to fetch usage records from mock store:", error);
        toast({
          variant: "destructive",
          title: "Failed to load usage records",
          description: "Could not retrieve usage data. Check console for details.",
        });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading usage records...</p>
        </div>
    );
  }

  return (
    <div className="mt-6">
      <PageHeader 
        title="All Usage Records"
        description="A comprehensive log of all water usage across all customers."
      />
      <Card className="shadow-md glassmorphism-card">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-16rem)] w-full"> 
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time Range</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Cost (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No water usage records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  usageRecords.map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.customerName}</TableCell>
                      <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                      <TableCell>{`${format(new Date(record.startTime), 'p')} - ${format(new Date(record.endTime), 'p')}`}</TableCell>
                      <TableCell className="text-right">{formatDurationFromHours(record.durationHours)}</TableCell>
                      <TableCell className="text-right">{record.cost.toLocaleString('en-US')}</TableCell>
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
