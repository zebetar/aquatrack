
"use client";

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CORE_WATER_RATE_PER_HOUR, updateCoreWaterRate } from '@/lib/constants';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Droplets, UserCircle, Bot, FileDown, FileUp, Palette, UserCog, Search } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Customer } from '@/types';
import { CustomerListTable } from '@/components/admin/customers/customer-list-table';
import { getAllCustomers, getUsageRecordsByCustomerId } from '@/lib/firebase-service';

const adminChangeNameSchema = z.object({
  newAdminName: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
});
type AdminChangeNameFormValues = z.infer<typeof adminChangeNameSchema>;

const avatarSchema = z.object({
    avatarUrl: z.string().url({ message: "Please enter a valid URL." }).or(z.literal("")),
});
type AvatarFormValues = z.infer<typeof avatarSchema>;

type CustomerWithUsage = Customer & { totalUsageHours?: number };

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user, updateAdminName, updateUserAvatarUrl } = useAuth();
  
  // Settings States
  const [currentRate, setCurrentRate] = useState(CORE_WATER_RATE_PER_HOUR);
  const [newRateInput, setNewRateInput] = useState(String(CORE_WATER_RATE_PER_HOUR));
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isAutomatedRemindersEnabled, setAutomatedRemindersEnabled] = useState(false);

  // User Management States
  const [customers, setCustomers] = useState<CustomerWithUsage[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);
    try {
      const storedCustomers = await getAllCustomers();
      const customersWithUsage: CustomerWithUsage[] = await Promise.all(storedCustomers.map(async (customer) => {
        const usageRecords = await getUsageRecordsByCustomerId(customer.id);
        const totalUsageHours = usageRecords.reduce((sum, record) => sum + record.durationHours, 0);
        return { ...customer, totalUsageHours };
      }));
      setCustomers(customersWithUsage);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load customer data.' });
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setCurrentRate(CORE_WATER_RATE_PER_HOUR);
    setNewRateInput(String(CORE_WATER_RATE_PER_HOUR));
    if(typeof window !== 'undefined') {
        const savedReminderSetting = localStorage.getItem('automated_reminders_enabled') === 'true';
        setAutomatedRemindersEnabled(savedReminderSetting);
    }
  }, []);

  const handleCustomerDeleted = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setDeletingCustomerId(null);
  };
  
  const handleCustomerUpdated = () => {
    fetchCustomers(); // Refetch all customers to get the updated data
  }

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customers, searchTerm]);
  
  const handleReminderToggle = (enabled: boolean) => {
    setAutomatedRemindersEnabled(enabled);
    localStorage.setItem('automated_reminders_enabled', String(enabled));
    toast({
        title: "Automation Setting Updated",
        description: `Automated bill reminders are now ${enabled ? 'ON' : 'OFF'}.`
    });
  };

  const adminNameForm = useForm<AdminChangeNameFormValues>({
    resolver: zodResolver(adminChangeNameSchema),
    defaultValues: { newAdminName: user?.name || "" },
  });

  const avatarForm = useForm<AvatarFormValues>({
    resolver: zodResolver(avatarSchema),
    defaultValues: { avatarUrl: user?.avatarUrl || "" },
  });
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.name) {
      adminNameForm.reset({ newAdminName: user.name });
    }
    if(user?.avatarUrl) {
        avatarForm.reset({ avatarUrl: user.avatarUrl });
    }
  }, [user, adminNameForm, avatarForm]);


  const handleSaveWaterRate = () => {
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
    await updateAdminName(values.newAdminName);
    setIsSavingName(false);
  };

  const handleAvatarChange = async (values: AvatarFormValues) => {
      setIsSavingAvatar(true);
      await updateUserAvatarUrl(values.avatarUrl || null);
      setIsSavingAvatar(false);
  };
  
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
              const result = loadEvent.target?.result;
              if (typeof result === 'string') {
                  avatarForm.setValue('avatarUrl', result);
              }
          }
          reader.readAsDataURL(file);
      }
  }

  
  const handleToggleTheme = () => {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('dark')) {
      htmlElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      toast({ title: "Theme Changed", description: "Switched to Light Mode." });
    } else {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      toast({ title: "Theme Changed", description: "Switched to Dark Mode." });
    }
  };
  
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleBackupNotImplemented = () => {
      toast({ title: "Coming Soon!", description: "Data backup and restore functionality is planned for a future update." });
  }

  const searchInput = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input 
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  );

  return (
    <>
      <Accordion type="multiple" defaultValue={['admin-account', 'system-ops', 'water-rate']} className="w-full space-y-4 mt-6">
        
        {/* User Management Section */}
        <AccordionItem value="user-management" className="border-none rounded-lg overflow-hidden shadow-md glassmorphism-card">
          <AccordionTrigger className="p-4 hover:no-underline w-full text-left">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              <h3 className="text-lg font-semibold">User Management</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4">
              <div className="flex justify-end mb-4">
                 <Dialog>
                    <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Search className="h-5 w-5" />
                        <span className="sr-only">Search Customers</span>
                    </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xs">
                    <DialogHeader>
                        <DialogTitle>Search Customers</DialogTitle>
                    </DialogHeader>
                    {searchInput}
                    </DialogContent>
                </Dialog>
              </div>
              {isLoadingCustomers ? (
                <div className="flex items-center justify-center h-40">
                  <Droplets className="h-8 w-8 animate-pulse-subtle text-primary" />
                  <p className="ml-2">Loading users...</p>
                </div>
              ) : (
                <CustomerListTable 
                  customers={filteredCustomers} 
                  onCustomerDeleted={handleCustomerDeleted}
                  onCustomerUpdated={handleCustomerUpdated}
                  deletingCustomerId={deletingCustomerId} 
                  enableActions={true}
                  className="h-auto max-h-[60vh]"
                />
              )}
          </AccordionContent>
        </AccordionItem>

        {/* Water Rate Section */}
        <AccordionItem value="water-rate" className="border-none rounded-lg overflow-hidden shadow-md glassmorphism-card">
          <AccordionTrigger className="p-4 hover:no-underline w-full text-left">
            <h3 className="text-lg font-semibold">Water Rate</h3>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="coreWaterRate">Core Water Rate (PKR/hour)</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="coreWaterRate"
                  type="number"
                  value={newRateInput}
                  onChange={(e) => setNewRateInput(e.target.value)}
                  className="max-w-xs"
                  placeholder="e.g., 1200"
                />
                <Button onClick={handleSaveWaterRate} disabled={isSavingRate}>
                  {isSavingRate && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
                  Save Rate
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Automation Settings */}
        <AccordionItem value="automation" className="border-none rounded-lg overflow-hidden shadow-md glassmorphism-card">
          <AccordionTrigger className="p-4 hover:no-underline w-full text-left">
             <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Automation Settings</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex items-center justify-between rounded-lg border bg-card/50 p-4">
                <div>
                    <Label htmlFor="automated-reminders" className="font-semibold">Automated Bill Reminders</Label>
                    <p className="text-sm text-muted-foreground">Automatically send notifications to customers with outstanding bills.</p>
                </div>
                <Switch 
                    id="automated-reminders"
                    checked={isAutomatedRemindersEnabled}
                    onCheckedChange={handleReminderToggle}
                />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Edit Account Section */}
        <AccordionItem value="admin-account" className="border-none rounded-lg overflow-hidden shadow-md glassmorphism-card">
          <AccordionTrigger className="p-4 hover:no-underline w-full text-left">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Admin Account</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4">
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Change Name Section */}
                <div className="space-y-4 rounded-lg border bg-card/50 p-4">
                    <h4 className="font-semibold">Change Admin Name</h4>
                    <Form {...adminNameForm}>
                      <form onSubmit={adminNameForm.handleSubmit(handleAdminNameChange)} className="space-y-4">
                        <FormField
                          control={adminNameForm.control}
                          name="newAdminName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Admin Display Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Site Administrator" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={isSavingName} className="w-full">
                          {isSavingName && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
                          Save Name
                        </Button>
                      </form>
                    </Form>
                </div>

                {/* Avatar Section */}
                <div className="space-y-4 rounded-lg border bg-card/50 p-4">
                    <h4 className="font-semibold">Update Avatar</h4>
                    <Form {...avatarForm}>
                        <form onSubmit={avatarForm.handleSubmit(handleAvatarChange)} className="space-y-4">
                            <FormField
                                control={avatarForm.control}
                                name="avatarUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Avatar URL or Data URI</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="https://example.com/avatar.png" {...field} className="h-24" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex flex-wrap gap-2">
                                <Button type="submit" disabled={isSavingAvatar} className="flex-1">
                                    {isSavingAvatar && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
                                    Save Avatar
                                </Button>
                                <Button type="button" variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>Upload File</Button>
                                <input type="file" ref={fileInputRef} onChange={handleAvatarFileSelect} accept="image/*" className="hidden"/>
                            </div>
                        </form>
                    </Form>
                </div>
              </div>


              {/* Credentials Section */}
              <div className="flex flex-col gap-4 rounded-lg border bg-card/50 p-4 sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-1">
                      <h4 className="font-semibold">Login Credentials</h4>
                      <p className="text-sm text-muted-foreground">
                          Email and password can be updated in your Firebase project.
                      </p>
                  </div>
                  <div>
                       <p className="text-sm font-medium">
                          <code className="bg-muted px-2 py-1 rounded-md">{user?.email || 'admin@example.com'}</code>
                       </p>
                  </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* System Operations Section */}
        <AccordionItem value="system-ops" className="border-none rounded-lg overflow-hidden shadow-md glassmorphism-card">
          <AccordionTrigger className="p-4 hover:no-underline w-full text-left">
            <h3 className="text-lg font-semibold">System Operations</h3>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border border-border/50 p-4 bg-card/80">
                <div>
                  <h3 className="font-medium">PDF Data Export</h3>
                   <p className="text-sm text-muted-foreground">Generate PDF statements for customers.</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/admin/data-export"><FileDown className="mr-2 h-4 w-4" />Export PDFs</Link>
                </Button>
              </div>
               <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border border-border/50 p-4 bg-card/80">
                <div>
                  <h3 className="font-medium">Data Backup & Restore</h3>
                   <p className="text-sm text-muted-foreground">This feature is not yet implemented.</p>
                </div>
                <div className='flex items-center gap-2'>
                  <Button variant="outline" onClick={handleBackupNotImplemented}><FileDown className="mr-2 h-4 w-4" />Backup</Button>
                  <Button variant="outline" onClick={handleBackupNotImplemented}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Restore
                  </Button>
                </div>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border border-border/50 p-4 bg-card/80">
                <div>
                  <h3 className="font-medium">System Theme</h3>
                   <p className="text-sm text-muted-foreground">Switch between light and dark mode.</p>
                </div>
                <Button variant="outline" onClick={handleToggleTheme}><Palette className="mr-2 h-4 w-4" />Toggle Theme</Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
