
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPaymentsPage() {
  return (
    <>
      <PageHeader 
        title="Payment Management" 
        description="Track and record all customer payments."
      />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>All Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Payment records for all customers will be displayed and managed here.
            Functionality to view, filter, and possibly record new payments centrally can be implemented.
          </p>
          {/* Placeholder for table or list of payment records */}
        </CardContent>
      </Card>
    </>
  );
}
