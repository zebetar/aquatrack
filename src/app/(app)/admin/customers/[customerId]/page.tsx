
import { PageHeader } from '@/components/shared/page-header';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { CustomerDetailsView } from '@/components/admin/customers/customer-details-view';
import { LogUsageDialog } from '@/components/admin/customers/log-usage-dialog';
import { RecordPaymentDialog } from '@/components/admin/customers/record-payment-dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Placeholder data fetching functions - now returning empty/null
async function getCustomerDetails(customerId: string): Promise<Customer | null> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Shorter delay
  // Return null to indicate no customer found or data cleared
  return null;
}

async function getWaterUsage(customerId: string): Promise<WaterUsageRecord[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  // Return empty array
  return [];
}

async function getPayments(customerId: string): Promise<Payment[]> {
   await new Promise(resolve => setTimeout(resolve, 100));
  // Return empty array
  return [];
}


export default async function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  const customer = await getCustomerDetails(params.customerId);
  const usageRecords = await getWaterUsage(params.customerId);
  const payments = await getPayments(params.customerId);

  if (!customer) {
    return (
      <>
        <PageHeader title="Customer Not Found" description="This customer may not exist or data has been cleared." />
        <p className="text-muted-foreground">The requested customer could not be found or their data is not available.</p>
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
