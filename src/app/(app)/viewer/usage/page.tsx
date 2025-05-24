import { PageHeader } from '@/components/shared/page-header';
import type { WaterUsageRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { CORE_WATER_RATE_PER_HOUR } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';

// Placeholder data fetching function
async function getMyUsageHistory(viewerId: string): Promise<WaterUsageRecord[]> {
  // Simulate API delay and filter by viewerId (or associated customerId)
  await new Promise(resolve => setTimeout(resolve, 500));
  if (viewerId === 'viewer001') { // Assuming this viewer is linked to customer 'cust001'
    return [
      { id: 'usage001', customerId: 'cust001', customerName: 'Aarav Sharma', date: new Date('2024-07-10'), startTime: new Date('2024-07-10T10:00:00'), endTime: new Date('2024-07-10T12:00:00'), durationHours: 2, cost: 2400, recordedBy: 'admin001', createdAt: new Date() },
      { id: 'usage002', customerId: 'cust001', customerName: 'Aarav Sharma', date: new Date('2024-07-15'), startTime: new Date('2024-07-15T14:00:00'), endTime: new Date('2024-07-15T15:30:00'), durationHours: 1.5, cost: 1800, recordedBy: 'admin001', createdAt: new Date() },
      { id: 'usage003', customerId: 'cust001', customerName: 'Aarav Sharma', date: new Date('2024-06-20'), startTime: new Date('2024-06-20T09:00:00'), endTime: new Date('2024-06-20T11:30:00'), durationHours: 2.5, cost: 3000, recordedBy: 'admin001', createdAt: new Date() },
    ];
  }
  return [];
}

export default async function ViewerUsagePage() {
  // In a real app, get viewerId from auth context
  const viewerId = 'viewer001'; 
  const usageRecords = await getMyUsageHistory(viewerId);

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
            <div>
                <p className="text-sm text-muted-foreground">Total Hours Consumed (All Time)</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(2)} hrs</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Total Cost (All Time)</p>
                <p className="text-2xl font-bold">₹{totalCost.toLocaleString('en-IN')}</p>
            </div>
        </CardContent>
      </Card>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Usage Records</CardTitle>
          <CardDescription>Water is charged at ₹{CORE_WATER_RATE_PER_HOUR} per hour.</CardDescription>
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
                  <TableHead className="text-right">Cost (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageRecords.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No usage records found.</TableCell></TableRow>
                )}
                {usageRecords.map(record => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                    <TableCell>{format(new Date(record.startTime), 'p')}</TableCell>
                    <TableCell>{format(new Date(record.endTime), 'p')}</TableCell>
                    <TableCell className="text-right">{record.durationHours.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{record.cost.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
