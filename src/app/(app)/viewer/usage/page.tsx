
"use client";

import { PageHeader } from '@/components/shared/page-header';
import type { WaterUsageRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { CORE_WATER_RATE_PER_HOUR } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getMockUsageRecordsByCustomerId } from '@/lib/mock-data-store';
import { Loader2 } from 'lucide-react';

export default function ViewerUsagePage() {
  const { user, loading: authLoading } = useAuth();
  const [usageRecords, setUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsageData = useCallback(async () => {
    if (!user || !user.customerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // Simulate async fetch
    await new Promise(resolve => setTimeout(resolve, 200));
    const records = getMockUsageRecordsByCustomerId(user.customerId);
    // Sort by most recent first before setting
    records.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    setUsageRecords(records || []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadUsageData();
    }
  }, [authLoading, loadUsageData]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading usage history...</p>
      </div>
    );
  }

  if (!user) {
      return <p>Not authenticated. Please log in.</p>
  }

  const totalHours = usageRecords.reduce((sum, record) => sum + record.durationHours, 0);
  const totalCost = usageRecords.reduce((sum, record) => sum + record.cost, 0);

  return (
    <>
      <PageHeader title="My Water Usage" description="Detailed history of your water consumption." />
      <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle>Usage Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4 shadow">
                <p className="text-sm text-muted-foreground">Total Hours Consumed (All Time)</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(2)} hrs</p>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow">
                <p className="text-sm text-muted-foreground">Total Cost (All Time)</p>
                <p className="text-2xl font-bold">PKR {totalCost.toLocaleString('en-US')}</p>
            </div>
        </CardContent>
      </Card>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Usage Records</CardTitle>
          <CardDescription>Water is charged at PKR {CORE_WATER_RATE_PER_HOUR} per hour.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
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
                {usageRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No usage records found.</TableCell></TableRow>
                ) : (
                  usageRecords.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                      <TableCell>{format(new Date(record.startTime), 'p')}</TableCell>
                      <TableCell>{format(new Date(record.endTime), 'p')}</TableCell>
                      <TableCell className="text-right">{record.durationHours.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{record.cost.toLocaleString('en-US')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
