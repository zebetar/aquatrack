
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
import { Droplets } from 'lucide-react';

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
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Droplets className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline justify-between">
                     <h3 className="text-base font-semibold truncate pr-2">{record.customerName}</h3>
                     <p className="font-semibold text-lg text-primary whitespace-nowrap">PKR {record.cost.toLocaleString('en-US')}</p>
                  </div>
                   <div className="flex items-baseline justify-between text-sm">
                      <p className="text-muted-foreground">{format(new Date(record.date), 'PP')}</p>
                      <p className="font-medium">{formatDurationFromHours(record.durationHours)}</p>
                   </div>
                </div>
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
                <TableHead className="w-16"></TableHead>
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
                  <TableCell>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Droplets className="h-5 w-5 text-primary" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{record.customerName}</TableCell>
                  <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                  <TableCell>{`${format(new Date(record.startTime), 'p')} - ${format(new Date(record.endTime), 'p')}`}</TableCell>
                  <TableCell className="text-right">{formatDurationFromHours(record.durationHours)}</TableCell>
                  <TableCell className="text-right font-semibold">{record.cost.toLocaleString('en-US')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </>
  );
}
