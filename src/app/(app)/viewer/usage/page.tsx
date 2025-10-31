"use client";

import type { WaterUsageRecord, Notification as TNotification } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase-config';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Droplets, AlertTriangle } from 'lucide-react';
import { formatDurationFromHours } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function ViewerUsagePage() {
  const { user, loading: authLoading } = useAuth();
  const [usageRecords, setUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadUsageData = useCallback(async () => {
    if (!user || !user.customerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const q = query(
        collection(db, `customers/${user.customerId}/usageRecords`),
        orderBy('startTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              ...data,
              date: (data.date as Timestamp).toDate(),
              startTime: (data.startTime as Timestamp).toDate(),
              endTime: (data.endTime as Timestamp).toDate(),
          } as WaterUsageRecord
      });
      setUsageRecords(records);
    } catch (error) {
      console.error("Error fetching usage records:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch usage history.' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) {
      loadUsageData();
    }
  }, [authLoading, loadUsageData]);

  const handleReportIssue = async (record: WaterUsageRecord) => {
    if (!user || !user.customerId) return;
    
    try {
      const issueNotification: Omit<TNotification, 'id' | 'createdAt'> = {
          userId: 'admin-user-id', // In a real app, this would be a specific admin's ID
          message: `Issue reported by ${user.name} for usage on ${format(new Date(record.date), 'PP')}.`,
          type: 'ISSUE_REPORTED',
          isRead: false,
          linkTo: `/admin/customers/${user.customerId}`,
      };
      await addDoc(collection(db, 'notifications'), {
        ...issueNotification,
        createdAt: serverTimestamp()
      });

      toast({
          title: "Issue Reported",
          description: "Your report has been sent to the admin for review.",
      });
    } catch (error) {
      console.error("Error reporting issue:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not report issue.' });
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Droplets className="h-8 w-8 animate-pulse-subtle text-primary" />
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
    <div className="mt-6 space-y-6">
      <Card className="shadow-md glassmorphism-card">
        <CardHeader>
          <CardTitle>Usage Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4 shadow">
                <p className="text-sm text-muted-foreground">Total Consumed (All Time)</p>
                <p className="text-2xl font-bold">{formatDurationFromHours(totalHours)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow">
                <p className="text-sm text-muted-foreground">Total Cost (All Time)</p>
                <p className="text-2xl font-bold">PKR {totalCost.toLocaleString('en-US')}</p>
            </div>
        </CardContent>
      </Card>
      <Card className="shadow-md glassmorphism-card">
        <CardHeader>
          <CardTitle>Usage Records</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-24rem)] w-full"> {/* Adjusted height if summary is taller */}
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Cost (PKR)</TableHead>
                  <TableHead className="text-center">Report Issue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24">No usage records found.</TableCell></TableRow>
                ) : (
                  usageRecords.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                      <TableCell>{format(new Date(record.startTime), 'p')}</TableCell>
                      <TableCell>{format(new Date(record.endTime), 'p')}</TableCell>
                      <TableCell className="text-right">{formatDurationFromHours(record.durationHours)}</TableCell>
                      <TableCell className="text-right">{record.cost.toLocaleString('en-US')}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" title="Report an issue with this record" onClick={() => handleReportIssue(record)}>
                            <AlertTriangle className="h-4 w-4 text-amber-500 hover:text-amber-600" />
                        </Button>
                      </TableCell>
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
