
import { PageHeader } from '@/components/shared/page-header';
import type { Payment, Customer } from '@/types'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

// Placeholder data fetching functions - now returning empty/null
async function getMyPayments(viewerId: string): Promise<Payment[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return [];
}

async function getMyCustomerProfile(viewerId: string): Promise<Customer | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
   // For cleared data, return a default "empty" profile or null
  return null; 
  // Or if you want a shell with 0 balance:
  // return { id: 'clearedCust', name: 'N/A', contactInfo: 'N/A', createdAt: new Date(), balance: 0, authUID: viewerId };
}


export default async function ViewerBillingPage() {
  // In a real app, get viewerId from auth context
  const viewerId = 'viewer001'; // This would come from auth context
  const payments = await getMyPayments(viewerId);
  const customerProfile = await getMyCustomerProfile(viewerId);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

  return (
    <>
      <PageHeader title="My Billing & Payments" description="View your outstanding balance and payment history." />
      
      {customerProfile ? (
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
      ) : (
         <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">Billing information is currently unavailable.</p>
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
                    <TableCell className="text-green-600">Recorded</TableCell> 
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
