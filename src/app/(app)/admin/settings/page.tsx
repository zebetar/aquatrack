
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { CORE_WATER_RATE_PER_HOUR, updateCoreWaterRate } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [currentRate, setCurrentRate] = useState(CORE_WATER_RATE_PER_HOUR);
  const [newRateInput, setNewRateInput] = useState(String(CORE_WATER_RATE_PER_HOUR));
  const [isSavingRate, setIsSavingRate] = useState(false);

  // Notification preferences (mock state)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  useEffect(() => {
    setCurrentRate(CORE_WATER_RATE_PER_HOUR);
    setNewRateInput(String(CORE_WATER_RATE_PER_HOUR));
  }, []);


  const handleSaveWaterRate = async () => {
    setIsSavingRate(true);
    const rateValue = parseFloat(newRateInput);

    if (isNaN(rateValue) || rateValue < 0) {
      toast({
        variant: "destructive",
        title: "Invalid Rate",
        description: "Please enter a valid positive number for the water rate.",
      });
      setIsSavingRate(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 700));
    
    updateCoreWaterRate(rateValue);
    setCurrentRate(rateValue); 

    toast({
      title: "Water Rate Updated",
      description: `The core water rate has been set to PKR ${rateValue}/hour.`,
    });
    setIsSavingRate(false);
  };

  const handleNotImplemented = (featureName: string) => {
    toast({
      title: "Feature Not Implemented",
      description: `${featureName} functionality is not yet available.`, // Shortened
    });
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage application settings and configurations." />
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>General Configuration</CardTitle>
            <CardDescription>Core system parameters.</CardDescription> 
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coreWaterRate">Core Water Rate (PKR/hour)</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="coreWaterRate" 
                  type="number"
                  value={newRateInput} 
                  onChange={(e) => setNewRateInput(e.target.value)}
                  className="max-w-xs"
                  placeholder="e.g., 1200"
                />
                <Button onClick={handleSaveWaterRate} disabled={isSavingRate}>
                  {isSavingRate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Rate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Current effective rate: PKR {currentRate}/hour. This rate is fundamental for calculating usage costs.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Manage how admins receive system alerts.</CardDescription> 
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
            <CardDescription>Advanced system management features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">User Management</h3>
                <p className="text-sm text-muted-foreground">Create, manage, and assign roles to admin and viewer accounts.</p>
              </div>
              <Button variant="outline" onClick={() => handleNotImplemented('User Management')}>Manage Users</Button>
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">Data Export</h3>
                <p className="text-sm text-muted-foreground">Export customer data, usage records, or payment histories.</p>
              </div>
              <Button variant="outline" onClick={() => handleNotImplemented('Data Export')}>Export Data</Button>
            </div>
             <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border p-4">
              <div>
                <h3 className="font-medium">System Theme</h3>
                <p className="text-sm text-muted-foreground">Toggle between light and dark mode for the application.</p>
              </div>
              <Button variant="outline" onClick={() => handleNotImplemented('System Theme Toggle')}>Toggle Theme</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
