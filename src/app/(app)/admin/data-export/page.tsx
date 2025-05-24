
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Users, Droplets, CreditCard, Combine } from 'lucide-react';
import Link from 'next/link';

export default function DataExportPage() {
  const { toast } = useToast();

  const handleMockExport = (dataType: string, format: string) => {
    toast({
      title: "Export Initiated (Mock)",
      description: `${dataType} data export to ${format} has started. (This is a mock action)`,
    });
  };

  return (
    <>
      <PageHeader 
        title="Data Export" 
        description="Select the data you wish to export from the system."
      />
      <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/settings">Back to Settings</Link>
      </Button>

      <Card className="glassmorphism-card shadow-md">
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Choose the data set and format for your export. Actual file download is not implemented in this mock.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Customer Data</h3>
              <p className="text-sm text-muted-foreground">Export a list of all customers and their details.</p>
            </div>
            <Button onClick={() => handleMockExport("All Customer", "CSV")} variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export as CSV
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><Droplets className="mr-2 h-5 w-5 text-primary"/>Water Usage Records</h3>
              <p className="text-sm text-muted-foreground">Export all logged water usage records for all customers.</p>
            </div>
            <Button onClick={() => handleMockExport("All Water Usage", "CSV")} variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export as CSV
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Payment Histories</h3>
              <p className="text-sm text-muted-foreground">Export all recorded payment transactions.</p>
            </div>
            <Button onClick={() => handleMockExport("All Payment Histories", "CSV")} variant="outline">
               <FileDown className="mr-2 h-4 w-4" /> Export as CSV
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><Combine className="mr-2 h-5 w-5 text-primary"/>Combined Data Dump</h3>
              <p className="text-sm text-muted-foreground">Export all customers, usage, and payments in a single JSON file.</p>
            </div>
            <Button onClick={() => handleMockExport("Combined System Data", "JSON")} variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export as JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
