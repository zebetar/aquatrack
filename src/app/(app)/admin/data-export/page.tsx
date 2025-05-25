
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Users, Droplets, CreditCard, Combine, DatabaseZap, AlertTriangle, Trash2 } from 'lucide-react'; // Added Trash2
import Link from 'next/link';
import { exportMockDataAsJSON, clearAllMockData } from '@/lib/mock-data-store';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

export default function DataExportPage() {
  const { toast } = useToast();
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);

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

  const handleConfirmClearAllData = () => {
    clearAllMockData();
    toast({
      title: "Mock Data Cleared",
      description: "All application data in localStorage has been cleared. You may need to refresh pages to see the changes.",
      variant: "default",
    });
    setIsClearDataDialogOpen(false);
    // Optionally, force a reload or redirect to reflect changes immediately
    // window.location.reload();
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

      <Card className="glassmorphism-card shadow-md border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5"/>System Reset</CardTitle>
          <CardDescription>
            Permanently clear all mock data (customers, usage, payments, notifications) from this browser's localStorage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Clear All Application Data (Mock)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All mock data including customers, water usage records, payments, and notifications stored in this browser will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmClearAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Clear All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <p className="text-xs text-muted-foreground mt-2">
            This action only affects data stored in this browser. It does not affect any real backend database.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
