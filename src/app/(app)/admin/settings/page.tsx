
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { CORE_WATER_RATE_PER_HOUR } from '@/lib/constants';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

export default function AdminSettingsPage() {
  // Mock state for notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  return (
    <>
      <PageHeader title="Settings" description="Manage application settings and configurations." />
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>General Configuration</CardTitle>
            <CardDescription>Core system parameters and information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coreWaterRate">Core Water Rate (PKR/hour)</Label>
              <Input id="coreWaterRate" value={CORE_WATER_RATE_PER_HOUR} readOnly disabled />
              <p className="text-xs text-muted-foreground">
                This rate is fundamental for calculating usage costs. It is configured elsewhere and displayed here for reference.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Manage how admins receive system alerts. (Mock UI)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                <span>Email Notifications</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receive important updates via email.
                </span>
              </Label>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                aria-label="Toggle email notifications"
              />
            </div>
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="sms-notifications" className="flex flex-col space-y-1">
                <span>SMS Alerts</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Get critical alerts via SMS (if configured).
                </span>
              </Label>
              <Switch
                id="sms-notifications"
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
                aria-label="Toggle SMS alerts"
              />
            </div>
             <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                <span>Push Notifications</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receive real-time push notifications in-app.
                </span>
              </Label>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                aria-label="Toggle push notifications"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle>System Operations</CardTitle>
            <CardDescription>Advanced system management features. (Placeholders)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">User Management</h3>
                <p className="text-sm text-muted-foreground">Create, manage, and assign roles to admin and viewer accounts.</p>
              </div>
              <Button variant="outline" disabled>Manage Users</Button>
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">Data Export</h3>
                <p className="text-sm text-muted-foreground">Export customer data, usage records, or payment histories.</p>
              </div>
              <Button variant="outline" disabled>Export Data</Button>
            </div>
             <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">System Theme</h3>
                <p className="text-sm text-muted-foreground">Toggle between light and dark mode for the application. (Not implemented)</p>
              </div>
              <Button variant="outline" disabled>Toggle Theme</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
