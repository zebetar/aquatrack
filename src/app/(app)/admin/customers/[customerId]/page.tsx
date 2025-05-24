import { PageHeader } from '@/components/shared/page-header';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { CustomerDetailsView } from '@/components/admin/customers/customer-details-view';
import { LogUsageDialog } from '@/components/admin/customers/log-usage-dialog';
import { RecordPaymentDialog } from '@/components/admin/customers/record-payment-dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Placeholder data fetching functions
async function getCustomerDetails(customerId: string): Promise<Customer | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (customerId === 'cust001') {
    return { id: 'cust001', name: 'Aarav Sharma', contactInfo: '9876543210', createdAt: new Date('2023-01-15'), balance: 1200, authUID: 'viewer001' };
  }
  return null;
}

async function getWaterUsage(customerId: string): Promise<WaterUsageRecord[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (customerId === 'cust001') {
    return [
      { id: 'usage001', customerId: 'cust001', customerName: 'Aarav Sharma', date: new Date('2024-07-10'), startTime: new Date('2024-07-10T10:00:00'), endTime: new Date('2024-07-10T12:00:00'), durationHours: 2, cost: 2400, recordedBy: 'admin001', createdAt: new Date() },
      { id: 'usage002', customerId: 'cust001', customerName: 'Aarav Sharma', date: new Date('2024-07-15'), startTime: new Date('2024-07-15T14:00:00'), endTime: new Date('2024-07-15T15:30:00'), durationHours: 1.5, cost: 1800, recordedBy: 'admin001', createdAt: new Date() },
    ];
  }
  return [];
}

async function getPayments(customerId: string): Promise<Payment[]> {
   await new Promise(resolve => setTimeout(resolve, 300));
  if (customerId === 'cust001') {
    return [
      { id: 'pay001', customerId: 'cust001', customerName: 'Aarav Sharma', paymentDate: new Date('2024-07-12'), amountPaid: 2000, recordedBy: 'admin001', createdAt: new Date() },
    ];
  }
  return [];
}


export default async function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  const customer = await getCustomerDetails(params.customerId);
  const usageRecords = await getWaterUsage(params.customerId);
  const payments = await getPayments(params.customerId);

  if (!customer) {
    return (
      <>
        <PageHeader title="Customer Not Found" />
        <p>The requested customer could not be found.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/admin/customers"><ArrowLeft className="mr-2 h-4 w-4" />Back to Customers</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title={customer.name} 
        description={`Details for customer ID: ${customer.id}`}
        actions={
          <div className="flex gap-2">
            <LogUsageDialog customer={customer} />
            <RecordPaymentDialog customer={customer} />
          </div>
        }
      />
      <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/customers"><ArrowLeft className="mr-2 h-4 w-4" />Back to Customers List</Link>
      </Button>
      <CustomerDetailsView customer={customer} usageRecords={usageRecords} payments={payments} />
    </>
  );
}
