
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { WaterUsageRecord } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { getAllMockUsageRecords } from '@/lib/mock-data-store';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { formatDurationFromHours } from '@/lib/utils';

export default function AdminUsagePage() {
  const [usageRecords, setUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsageData = useCallback(() => {
    setIsLoading(true);
    const records = getAllMockUsageRecords();
    // Sort by most recent first
    records.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    setUsageRecords(records);
    setIsLoading(false);
  }, []);

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
    <Card className="shadow-md mt-6">
      <CardHeader>
        <CardTitle>All Usage Records</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)] w-full"> {/* Adjusted height */}
          <Table>
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
                  <TableCell colSpan={5} className="h-24 text-center"> {/* Adjusted colSpan */}
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
  );
}
