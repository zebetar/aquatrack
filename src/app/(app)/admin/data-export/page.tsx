
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Users, Droplets, CreditCard, DatabaseZap } from 'lucide-react'; 
import Link from 'next/link';
import { exportMockDataAsJSON } from '@/lib/mock-data-store';
import { format } from 'date-fns';

export default function DataExportPage() {
  const { toast } = useToast();

  const handleMockExport = (dataType: string, format: string) => {
    toast({
      title: "Export Initiated (Mock)",
      description: `${dataType} data export to ${format} has started. (This is a mock action)`,
    });
  };

  const handleDownloadAllMockData = () => {
    try {
      const jsonData = exportMockDataAsJSON();
      if (jsonData === "{\n  \"customers\": [],\n  \"usageRecords\": [],\n  \"payments\": [],\n  \"notifications\": []\n}") {
         toast({
          variant: "default",
          title: "No Data to Export",
          description: "The mock data store is currently empty.",
        });
        return;
      }
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aquatrack_mock_data_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Mock Data Exported",
        description: "All current mock data from localStorage has been downloaded as a JSON file.",
      });
    } catch (error) {
      console.error("Error exporting mock data:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not export the mock data.",
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Data Export & Management"
        description="Manage and export application data."
      />
      <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/settings">Back to Settings</Link>
      </Button>

      <Card className="glassmorphism-card shadow-md mb-6">
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Download current mock data from localStorage or simulate other export types.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Customer Data</h3>
              <p className="text-sm text-muted-foreground">Simulate exporting a list of all customers and their details.</p>
            </div>
            <Button onClick={() => handleMockExport("All Customer", "CSV")} variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export as CSV (Mock)
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><Droplets className="mr-2 h-5 w-5 text-primary"/>Water Usage Records</h3>
              <p className="text-sm text-muted-foreground">Simulate exporting all logged water usage records.</p>
            </div>
            <Button onClick={() => handleMockExport("All Water Usage", "CSV")} variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Export as CSV (Mock)
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Payment Histories</h3>
              <p className="text-sm text-muted-foreground">Simulate exporting all recorded payment transactions.</p>
            </div>
            <Button onClick={() => handleMockExport("All Payment Histories", "CSV")} variant="outline">
               <FileDown className="mr-2 h-4 w-4" /> Export as CSV (Mock)
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-card/80">
            <div className="mb-2 sm:mb-0">
              <h3 className="font-semibold text-lg flex items-center"><DatabaseZap className="mr-2 h-5 w-5 text-primary"/>Download Mock Data Backup</h3>
              <p className="text-sm text-muted-foreground">Download all current data from localStorage as a single JSON file. This is useful for backup or migration.</p>
            </div>
            <Button onClick={handleDownloadAllMockData} variant="outline">
              <FileDown className="mr-2 h-4 w-4" /> Download localStorage Data
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Removed System Reset Card and AlertDialog */}
    </>
  );
}
