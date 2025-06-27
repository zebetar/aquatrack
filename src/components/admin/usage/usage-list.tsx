
"use client";

import type { WaterUsageRecord } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { formatDurationFromHours } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';

interface UsageListProps {
  usageRecords: WaterUsageRecord[];
}

export function UsageList({ usageRecords }: UsageListProps) {
  if (usageRecords.length === 0) {
    return (
      <Card className="text-center glassmorphism-card">
        <CardContent className="py-12">
          <p className="text-muted-foreground">No water usage records found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {usageRecords.map((record) => (
          <Card key={record.id} className="glassmorphism-card">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-semibold truncate">{record.customerName}</h3>
                <p className="font-semibold text-lg text-primary whitespace-nowrap">
                  PKR {record.cost.toLocaleString('en-US')}
                </p>
              </div>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <p className="text-muted-foreground truncate">
                  {`${format(new Date(record.date), 'PP')} at ${format(new Date(record.startTime), 'p')}`}
                </p>
                <p className="font-medium whitespace-nowrap">{formatDurationFromHours(record.durationHours)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden shadow-md glassmorphism-card md:block">
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
              {usageRecords.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.customerName}</TableCell>
                  <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                  <TableCell>{`${format(new Date(record.startTime), 'p')} - ${format(new Date(record.endTime), 'p')}`}</TableCell>
                  <TableCell className="text-right">{formatDurationFromHours(record.durationHours)}</TableCell>
                  <TableCell className="text-right">{record.cost.toLocaleString('en-US')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </>
  );
}
