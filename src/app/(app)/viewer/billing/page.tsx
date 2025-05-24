import { PageHeader } from '@/components/shared/page-header';
import type { Payment, Customer } from '@/types'; // Assuming Customer type holds balance
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

// Placeholder data fetching functions
async function getMyPayments(viewerId: string): Promise<Payment[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (viewerId === 'viewer001') {
    return [
      { id: 'pay001', customerId: 'cust001', customerName: 'Aarav Sharma', paymentDate: new Date('2024-07-12T10:30:00'), amountPaid: 2000, recordedBy: 'admin001', createdAt: new Date() },
      { id: 'pay002', customerId: 'cust001', customerName: 'Aarav Sharma', paymentDate: new Date('2024-06-15T14:00:00'), amountPaid: 2500, recordedBy: 'admin001', createdAt: new Date() },
    ];
  }
  return [];
}

async function getMyCustomerProfile(viewerId: string): Promise<Customer | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
   // This should fetch customer linked to viewerId
  if (viewerId === 'viewer001') { 
    return { id: 'cust001', name: 'Aarav Sharma', contactInfo: '9876543210', createdAt: new Date('2023-01-15'), balance: 1200, authUID: 'viewer001' };
  }
  return null;
}


export default async function ViewerBillingPage() {
  // In a real app, get viewerId from auth context
  const viewerId = 'viewer001';
  const payments = await getMyPayments(viewerId);
  const customerProfile = await getMyCustomerProfile(viewerId);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

  return (
    <>
      <PageHeader title="My Billing & Payments" description="View your outstanding balance and payment history." />
      
      {customerProfile && (
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
                <p className="text-sm text-muted-foreground">Current Outstanding Balance</p>
                <p className="text-2xl font-bold">PKR {customerProfile.balance.toLocaleString('en-US')}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Total Amount Paid (All Time)</p>
                <p className="text-2xl font-bold">PKR {totalPaid.toLocaleString('en-US')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>List of all payments you have made.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="text-right">Amount Paid (PKR)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center h-24">No payment records found.</TableCell></TableRow>
                )}
                {payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.paymentDate), 'PP p')}</TableCell>
                    <TableCell className="text-right">{payment.amountPaid.toLocaleString('en-US')}</TableCell>
                    <TableCell className="text-green-600">Recorded</TableCell> {/* Placeholder status */}
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
