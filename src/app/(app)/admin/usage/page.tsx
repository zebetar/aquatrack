
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminUsagePage() {
  return (
    <>
      <PageHeader 
        title="Water Usage Management" 
        description="View and manage all customer water usage records."
      />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>All Usage Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Water usage records for all customers will be displayed and managed here. 
            Functionality to view, filter, and possibly add/edit records can be implemented.
          </p>
          {/* Placeholder for table or list of usage records */}
        </CardContent>
      </Card>
    </>
  );
}
