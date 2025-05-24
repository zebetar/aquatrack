import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage application settings and configurations." />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Application settings will be available here.</p>
          <ul className="mt-4 list-disc list-inside space-y-2">
            <li>User Management (Create/Manage Viewer Accounts)</li>
            <li>Core Water Rate: ₹1200/hr (Display only, configured elsewhere)</li>
            <li>Notification Preferences</li>
            <li>Data Export Options</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
