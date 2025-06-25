"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { summarizeApp, type SummarizeAppOutput } from '@/ai/flows/summarize-app-flow';
import { Loader2, Wand2, UserShield, User } from 'lucide-react';

// The detailed command provided by the user.
const APP_DESCRIPTION_COMMAND = `Create a comprehensive tubewell water supply management application named "AquaTrack" with two distinct user roles: Admin and Viewer.

Admin Functionalities:
The Admin should have full control over the system.
- Dashboard: Provide an overview of key metrics, including total customers, total monthly water supply, monthly revenue, total outstanding bills, and a list of recent system notifications.
- Customer Management: Admins must be able to create new customer profiles, view a sortable list of all customers, and access a detailed page for each individual. This detail page must allow the admin to edit the customer's information, log new water usage records, and record new payments.
- Data-rich Views: The admin must be able to view a complete history of all water usage records and all payment transactions across all customers on dedicated pages.
- Reporting & Analytics: Implement a reports section with data visualizations. This must include monthly supply and revenue data, a chart of top customers by consumption, and a financial summary of billed versus paid amounts for a selected month. Also include a specific report page listing all customers with outstanding balances.
- User & Data Management: Provide a user management section where admins can delete customer accounts. The deletion process must also trigger a PDF generation of the customer's final statement. Create a data export page that allows the admin to download filtered customer statements as PDFs and a full backup of the application's data in JSON format.
- System Settings: Allow the admin to configure core application parameters, such as the water rate (PKR per hour), and manage their own account details like display name and avatar.

Viewer (Customer) Functionalities:
The Viewer role is for customers to access their personal data.
- Dashboard: After logging in, a viewer should see a personalized dashboard summarizing their current outstanding bill, recent water usage (e.g., last 7 days), their last payment amount, and their most recent notifications.
- Usage and Billing History: Viewers must have access to dedicated pages showing their complete history of water usage records and all payments they have made.
- Notifications: A notification center should be available for viewers to see all communications sent to them, such as usage logs or payment confirmations.
- Profile Management: Allow viewers to manage their account by updating their profile picture, email address, and password.

Core System Logic:
- The application must calculate the cost of water usage based on the duration and the admin-configurable hourly rate.
- A customer's balance must be updated in real-time: increasing when new usage is logged and decreasing when a payment is recorded.
- The system should generate notifications for both admins and viewers for key events.
- All application data (customer profiles, usage records, payments, notifications) must be persisted in a Firestore database.
- Authentication for both roles must be handled by Firebase Authentication, securely linking a viewer's login credentials to their corresponding customer data profile in Firestore via a unique ID.`;

export default function StitchStudioPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummarizeAppOutput | null>(null);

  const handleGenerateSummary = useCallback(async () => {
    setIsLoading(true);
    setSummary(null);
    try {
      const result = await summarizeApp(APP_DESCRIPTION_COMMAND);
      setSummary(result);
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate the application summary.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return (
    <div className="mt-6 space-y-6">
      <Card className="glassmorphism-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            <span>AI Stitch Studio</span>
          </CardTitle>
          <CardDescription>
            Use Genkit to process the detailed application command into a structured summary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateSummary} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Stitching...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Summary from Command
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex h-40 items-center justify-center rounded-lg border bg-card/50 shadow-sm glassmorphism-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">AI is summarizing the command...</p>
        </div>
      )}

      {summary && (
        <Card className="glassmorphism-card shadow-lg animate-fade-in">
          <CardHeader>
            <CardTitle>{summary.title}</CardTitle>
            <CardDescription>{summary.summary}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-4 flex items-center text-lg font-semibold">
                <UserShield className="mr-2 h-5 w-5 text-primary" />
                Admin Features
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                {summary.adminFeatures.map((feature, index) => (
                  <li key={`admin-${index}`}>{feature}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 flex items-center text-lg font-semibold">
                <User className="mr-2 h-5 w-5 text-primary" />
                Viewer Features
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                {summary.viewerFeatures.map((feature, index) => (
                  <li key={`viewer-${index}`}>{feature}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
