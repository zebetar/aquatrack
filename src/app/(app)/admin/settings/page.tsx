
"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CORE_WATER_RATE_PER_HOUR, updateCoreWaterRate } from '@/lib/constants';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Droplets, Users, FileDown, Palette, UploadCloud, UserCircle, BellRing, Bot, FileUp, DatabaseZap } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from 'next/link';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from '@/components/ui/switch';
import { exportMockDataAsJSON, importMockDataFromJSON, seedAndOverwriteMockData } from '@/lib/mock-data-store';
import { format } from 'date-fns';

const adminChangeNameSchema = z.object({
  newAdminName: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
});
type AdminChangeNameFormValues = z.infer<typeof adminChangeNameSchema>;


export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user, updateAdminName, updateUserAvatarUrl } = useAuth();
  const [currentRate, setCurrentRate] = useState(CORE_WATER_RATE_PER_HOUR);
  const [newRateInput, setNewRateInput] = useState(String(CORE_WATER_RATE_PER_HOUR));
  const [isSavingRate, setIsSavingRate] = useState(false);

  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAutomatedRemindersEnabled, setAutomatedRemindersEnabled] = useState(false);
  
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    setCurrentRate(CORE_WATER_RATE_PER_HOUR);
    setNewRateInput(String(CORE_WATER_RATE_PER_HOUR));
    const savedReminderSetting = localStorage.getItem('automated_reminders_enabled') === 'true';
    setAutomatedRemindersEnabled(savedReminderSetting);
  }, []);
  
  const handleReminderToggle = (enabled: boolean) => {
    setAutomatedRemindersEnabled(enabled);
    localStorage.setItem('automated_reminders_enabled', String(enabled));
    toast({
        title: "Automation Setting Updated",
        description: `Automated bill reminders are now ${enabled ? 'ON' : 'OFF'}.`
    });
  };

  useEffect(() => {
    setAvatarPreview(user?.avatarUrl || null);
  }, [user?.avatarUrl]);

  const adminNameForm = useForm<AdminChangeNameFormValues>({
    resolver: zodResolver(adminChangeNameSchema),
    defaultValues: { newAdminName: user?.name || "" },
  });

  useEffect(() => {
    if (user?.name) {
      adminNameForm.reset({ newAdminName: user.name });
    }
  }, [user?.name, adminNameForm]);


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
    updateAdminName(values.newAdminName);
    setIsSavingName(false);
    toast({
      title: "Admin Name Updated",
      description: `Your display name is now ${values.newAdminName}.`,
    });
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for mock
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please select an image smaller than 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminAvatarChange = async () => {
    if (!avatarPreview && !user?.avatarUrl) { 
        toast({ title: "No Image", description: "Please select an image to update your avatar." });
        return;
    }
    if (avatarPreview === user?.avatarUrl) { 
        toast({ title: "No Change", description: "The selected image is the same as your current avatar." });
        return;
    }

    setIsSavingAvatar(true);
    updateUserAvatarUrl(avatarPreview); 
    setIsSavingAvatar(false);
  };
  
  const handleClearAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
    }
  };


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
  
  // Effect to set theme on initial load
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleDownloadAllData = () => {
    try {
      const jsonData = exportMockDataAsJSON();
      if (jsonData === "{\n  \"customers\": [],\n  \"usageRecords\": [],\n  \"payments\": [],\n  \"notifications\": []\n}") {
         toast({
          variant: "default",
          title: "No Data to Export",
          description: "The data store is currently empty.",
        });
        return;
      }
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AquaTrack_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Data Backup Exported",
        description: "All current data has been downloaded as a JSON file.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not export the data.",
      });
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ variant: "destructive", title: "No File Selected", description: "Please choose a JSON file to import." });
      return;
    }
    if (file.type !== 'application/json') {
      toast({ variant: "destructive", title: "Invalid File Type", description: "Please select a valid .json backup file." });
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const { success, message } = importMockDataFromJSON(jsonString);

        if (success) {
          toast({ title: "Import Successful", description: message });
          setTimeout(() => window.location.reload(), 1500); 
        } else {
          throw new Error(message);
        }
      } catch (error: any) {
        toast({ variant: "destructive", title: "Import Failed", description: error.message || "Could not process the file." });
      } finally {
        setIsImporting(false);
        if (importFileRef.current) {
          importFileRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSeedData = () => {
    try {
      seedAndOverwriteMockData();
      toast({
        title: "Database Seeded",
        description: "Rich mock data has been generated. Please reload the page to see the changes.",
      });
    } catch (error) {
      console.error("Error seeding mock data:", error);
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: "Could not generate mock data.",
      });
    }
  };


  return (
    <>
      <Accordion type="multiple" defaultValue={['admin-account', 'system-ops']} className="w-full space-y-4 mt-6">
        
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
              
              {/* Change Name Section */}
              <div className="flex flex-col gap-4 rounded-lg border bg-card/50 p-4 sm:flex-row sm:items-start">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold">Change Admin Name</h4>
                    <p className="text-sm text-muted-foreground">Update your display name.</p>
                  </div>
                  <div className="sm:w-2/3">
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
                        <Button type="submit" disabled={isSavingName} className="w-full sm:w-auto">
                          {isSavingName && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
                          Save Name
                        </Button>
                      </form>
                    </Form>
                  </div>
              </div>

              {/* Change Avatar Section */}
              <div className="flex flex-col gap-4 rounded-lg border bg-card/50 p-4 sm:flex-row sm:items-start">
                  <div className="flex-1 space-y-1">
                      <h4 className="font-semibold">Change Admin Avatar</h4>
                      <p className="text-sm text-muted-foreground">Upload a new profile picture.</p>
                  </div>
                  <div className="sm:w-2/3 space-y-4">
                      {avatarPreview && (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                          <Image src={avatarPreview} alt="Avatar Preview" layout="fill" objectFit="cover" />
                          </div>
                      )}
                      <Input
                          id="avatarFile"
                          type="file"
                          accept="image/png, image/jpeg, image/gif"
                          onChange={handleAvatarFileChange}
                          ref={fileInputRef}
                          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      <div className="flex flex-wrap gap-2">
                          <Button onClick={handleAdminAvatarChange} disabled={isSavingAvatar}>
                              {isSavingAvatar && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
                              <UploadCloud className="mr-2 h-4 w-4" />
                              Save Avatar
                          </Button>
                          {avatarPreview && (
                              <Button variant="outline" onClick={handleClearAvatar} disabled={isSavingAvatar}>
                                  Clear Preview
                              </Button>
                          )}
                      </div>
                  </div>
              </div>
              
              {/* Credentials Section */}
              <div className="flex flex-col gap-4 rounded-lg border bg-card/50 p-4 sm:flex-row sm:items-center">
                  <div className="flex-1 space-y-1">
                      <h4 className="font-semibold">Login Credentials</h4>
                      <p className="text-sm text-muted-foreground">
                          Email and password are fixed for this app.
                      </p>
                  </div>
                  <div>
                       <p className="text-sm font-medium">
                          <code className="bg-muted px-2 py-1 rounded-md">{user?.email || 'admin@aquatrack.com'}</code>
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
               <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div>
                  <h3 className="font-medium flex items-center gap-2"><DatabaseZap className="text-destructive"/>Seed Mock Database</h3>
                  <p className="text-sm text-muted-foreground">Overwrite all current data with a new, rich set of mock data. <span className="font-semibold">This cannot be undone.</span></p>
                </div>
                <Button variant="destructive" onClick={handleSeedData}>Seed Data</Button>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border border-border/50 p-4 bg-card/80">
                <div>
                  <h3 className="font-medium">User Management</h3>
                  <p className="text-sm text-muted-foreground">Edit or remove customer accounts.</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/admin/users"><Users className="mr-2 h-4 w-4" />Manage Users</Link>
                </Button>
              </div>
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
                   <p className="text-sm text-muted-foreground">Save or load all app data from a JSON file.</p>
                </div>
                <div className='flex items-center gap-2'>
                  <Button variant="outline" onClick={handleDownloadAllData}><FileDown className="mr-2 h-4 w-4" />Backup</Button>
                  <Button variant="outline" onClick={() => importFileRef.current?.click()} disabled={isImporting}>
                    {isImporting ? <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" /> : <FileUp className="mr-2 h-4 w-4" />}
                    Restore
                  </Button>
                  <Input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImportData} />
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
