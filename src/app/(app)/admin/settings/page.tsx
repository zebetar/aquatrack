
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { CORE_WATER_RATE_PER_HOUR, updateCoreWaterRate } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Eye, EyeOff, Users, KeyRound, FileDown, Palette, User } from 'lucide-react'; 
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';

// Schemas for admin (though functionality is mocked for email/password)
const adminChangeNameSchema = z.object({
  newAdminName: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
});
type AdminChangeNameFormValues = z.infer<typeof adminChangeNameSchema>;

const adminChangeEmailSchema = z.object({
  newAdminEmail: z.string().email({ message: "Please enter a valid email address." }),
});
type AdminChangeEmailFormValues = z.infer<typeof adminChangeEmailSchema>;

const adminChangePasswordSchema = z.object({
  currentAdminPassword: z.string().min(1, { message: "Current password is required." }),
  newAdminPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmAdminPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
}).refine(data => data.newAdminPassword === data.confirmAdminPassword, {
  message: "New passwords do not match.",
  path: ["confirmAdminPassword"],
});
type AdminChangePasswordFormValues = z.infer<typeof adminChangePasswordSchema>;


export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user, updateAdminName } = useAuth(); 
  const [currentRate, setCurrentRate] = useState(CORE_WATER_RATE_PER_HOUR);
  const [newRateInput, setNewRateInput] = useState(String(CORE_WATER_RATE_PER_HOUR));
  const [isSavingRate, setIsSavingRate] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setCurrentRate(CORE_WATER_RATE_PER_HOUR);
    setNewRateInput(String(CORE_WATER_RATE_PER_HOUR));
  }, []);

  const adminNameForm = useForm<AdminChangeNameFormValues>({
    resolver: zodResolver(adminChangeNameSchema),
    defaultValues: { newAdminName: user?.name || "" },
    values: { newAdminName: user?.name || "" } // Keep form in sync if user.name changes
  });
  
  useEffect(() => {
    if (user?.name) {
      adminNameForm.reset({ newAdminName: user.name });
    }
  }, [user?.name, adminNameForm]);


  const adminEmailForm = useForm<AdminChangeEmailFormValues>({
    resolver: zodResolver(adminChangeEmailSchema),
    defaultValues: { newAdminEmail: "" },
  });

  const adminPasswordForm = useForm<AdminChangePasswordFormValues>({
    resolver: zodResolver(adminChangePasswordSchema),
    defaultValues: { currentAdminPassword: "", newAdminPassword: "", confirmAdminPassword: "" },
  });


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

  const handleAdminNameChange = async (values: AdminChangeNameFormValues) => {
    setIsSavingName(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    updateAdminName(values.newAdminName);
    // Toast is handled by updateAdminName function in AuthContext
    setIsSavingName(false);
  };

  const handleAdminEmailChange = async (values: AdminChangeEmailFormValues) => {
    setIsSavingEmail(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({ title: "Mock Action", description: `Email change to ${values.newAdminEmail} simulated (not implemented).` });
    adminEmailForm.reset();
    setIsSavingEmail(false);
  };
  
  const handleAdminPasswordChange = async (values: AdminChangePasswordFormValues) => {
    setIsSavingPassword(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({ title: "Mock Action", description: "Password change simulated (not implemented)." });
    adminPasswordForm.reset();
    setIsSavingPassword(false);
  };

  const handleToggleTheme = () => {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('dark')) {
      htmlElement.classList.remove('dark');
      toast({ title: "Theme Changed", description: "Switched to Light Mode." });
    } else {
      htmlElement.classList.add('dark');
      toast({ title: "Theme Changed", description: "Switched to Dark Mode." });
    }
  };

  const PasswordVisibilityToggle = ({ isVisible, toggle }: { isVisible: boolean, toggle: () => void }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      onClick={toggle}
      tabIndex={-1}
    >
      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      <span className="sr-only">{isVisible ? "Hide password" : "Show password"}</span>
    </Button>
  );

  return (
    <>
      <Accordion type="multiple" className="w-full space-y-4 mt-6">
        <AccordionItem value="water-rate" className="border-none">
          <Card className="shadow-md glassmorphism-card">
            <CardHeader className="p-4">
              <AccordionTrigger className="p-0 hover:no-underline">
                <CardTitle>Water Rate</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent>
              <CardContent className="space-y-4 p-4 pt-0">
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
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="notification-prefs" className="border-none">
          <Card className="shadow-md glassmorphism-card">
            <CardHeader className="p-4">
              <AccordionTrigger className="p-0 hover:no-underline">
                <CardTitle>Notification Preferences</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent>
              <CardContent className="space-y-4 p-4 pt-0">
                <div className="flex items-center justify-between space-x-2 rounded-lg border border-border/50 p-4 bg-card/80">
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
                <div className="flex items-center justify-between space-x-2 rounded-lg border border-border/50 p-4 bg-card/80">
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
                 <div className="flex items-center justify-between space-x-2 rounded-lg border border-border/50 p-4 bg-card/80">
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
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="admin-account" className="border-none">
          <Card className="shadow-md glassmorphism-card">
            <CardHeader className="p-4">
               <AccordionTrigger className="p-0 hover:no-underline">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  <CardTitle>Edit Account</CardTitle>
                </div>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent>
              <CardContent className="p-4 pt-0 space-y-6">
                
                <div>
                  <h4 className="text-md font-semibold mb-2">Change Admin Name</h4>
                  <Form {...adminNameForm}>
                    <form onSubmit={adminNameForm.handleSubmit(handleAdminNameChange)} className="space-y-4">
                      <FormField
                        control={adminNameForm.control}
                        name="newAdminName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Site Administrator" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isSavingName}>
                        {isSavingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Name
                      </Button>
                    </form>
                  </Form>
                </div>

                <Separator className="my-6 bg-border/50"/>
                
                <div>
                  <h4 className="text-md font-semibold mb-2">Change Admin Email</h4>
                  <div className="mb-2">
                      <Label>Current Email</Label>
                      <Input value={user?.email || 'N/A'} readOnly />
                  </div>
                  <Form {...adminEmailForm}>
                    <form onSubmit={adminEmailForm.handleSubmit(handleAdminEmailChange)} className="space-y-4">
                      <FormField
                        control={adminEmailForm.control}
                        name="newAdminEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Admin Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="new.admin@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isSavingEmail}>
                        {isSavingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Change Admin Email
                      </Button>
                    </form>
                  </Form>
                </div>

                <Separator className="my-6 bg-border/50"/>

                <div>
                  <h4 className="text-md font-semibold mb-2">Change Admin Password</h4>
                  <Form {...adminPasswordForm}>
                    <form onSubmit={adminPasswordForm.handleSubmit(handleAdminPasswordChange)} className="space-y-4">
                       <FormField
                        control={adminPasswordForm.control}
                        name="currentAdminPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input type={showCurrentPassword ? "text" : "password"} placeholder="••••••••" {...field} className="pr-10" />
                              </FormControl>
                              <PasswordVisibilityToggle isVisible={showCurrentPassword} toggle={() => setShowCurrentPassword(!showCurrentPassword)} />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adminPasswordForm.control}
                        name="newAdminPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input type={showNewPassword ? "text" : "password"} placeholder="••••••••" {...field} className="pr-10" />
                              </FormControl>
                               <PasswordVisibilityToggle isVisible={showNewPassword} toggle={() => setShowNewPassword(!showNewPassword)} />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adminPasswordForm.control}
                        name="confirmAdminPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} className="pr-10" />
                              </FormControl>
                              <PasswordVisibilityToggle isVisible={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={isSavingPassword}>
                        {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Change Admin Password
                      </Button>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
        
        <AccordionItem value="system-ops" className="border-none">
          <Card className="shadow-md glassmorphism-card">
            <CardHeader className="p-4">
              <AccordionTrigger className="p-0 hover:no-underline">
                <CardTitle>System Operations</CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent>
              <CardContent className="space-y-4 p-4 pt-0">
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border border-border/50 p-4 bg-card/80">
                  <div>
                    <h3 className="font-medium">User Management</h3>
                    <p className="text-sm text-muted-foreground">List and manage customer accounts. Deletion includes PDF statement download.</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/admin/users"><Users className="mr-2 h-4 w-4"/>Manage Users</Link>
                  </Button>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border border-border/50 p-4 bg-card/80">
                  <div>
                    <h3 className="font-medium">Data Export</h3>
                    <p className="text-sm text-muted-foreground">Export customer data, usage records, or payment histories.</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/admin/data-export"><FileDown className="mr-2 h-4 w-4"/>Export Data</Link>
                  </Button>
                </div>
                 <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border border-border/50 p-4 bg-card/80">
                  <div>
                    <h3 className="font-medium">System Theme</h3>
                    <p className="text-sm text-muted-foreground">Toggle between light and dark mode for the application.</p>
                  </div>
                  <Button variant="outline" onClick={handleToggleTheme}><Palette className="mr-2 h-4 w-4"/>Toggle Theme</Button>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </>
  );
}
