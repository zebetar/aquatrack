"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { CORE_WATER_RATE_PER_HOUR, updateCoreWaterRate } from '@/lib/constants';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Users, KeyRound, FileDown, Palette, UploadCloud } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';

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


  useEffect(() => {
    setCurrentRate(CORE_WATER_RATE_PER_HOUR);
    setNewRateInput(String(CORE_WATER_RATE_PER_HOUR));
  }, []);

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
      toast({ title: "Theme Changed", description: "Switched to Light Mode." });
    } else {
      htmlElement.classList.add('dark');
      toast({ title: "Theme Changed", description: "Switched to Dark Mode." });
    }
  };

  return (
    <>
      <Accordion type="multiple" className="w-full space-y-4 mt-6">
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
                  {isSavingRate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Rate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Current effective rate: PKR {currentRate}/hour.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Edit Account Section */}
        <AccordionItem value="admin-account" className="border-none rounded-lg overflow-hidden shadow-md glassmorphism-card">
          <AccordionTrigger className="p-4 hover:no-underline w-full text-left">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Edit Account</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
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

              <Separator className="my-6 bg-border/50" />

              <div>
                <h4 className="text-md font-semibold mb-2">Change Admin Avatar</h4>
                <div className="space-y-4">
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
                      {isSavingAvatar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              <Separator className="my-6 bg-border/50" />
              <div>
                <h4 className="text-md font-semibold mb-2">Admin Login Credentials</h4>
                <p className="text-sm text-muted-foreground">
                  The admin login email (<code className="bg-muted p-1 rounded-sm">{user?.email || 'admin@aquatrack.com'}</code>) and password are fixed for this application.
                </p>
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
                  <h3 className="font-medium">User Management</h3>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/admin/users"><Users className="mr-2 h-4 w-4" />Manage Users</Link>
                </Button>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border border-border/50 p-4 bg-card/80">
                <div>
                  <h3 className="font-medium">Data Export</h3>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/admin/data-export"><FileDown className="mr-2 h-4 w-4" />Export Data</Link>
                </Button>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 rounded-lg border border-border/50 p-4 bg-card/80">
                <div>
                  <h3 className="font-medium">System Theme</h3>
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
