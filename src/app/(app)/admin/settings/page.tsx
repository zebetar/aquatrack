
"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CORE_WATER_RATE_PER_HOUR, updateCoreWaterRate } from '@/lib/constants';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Users, FileDown, Palette, UploadCloud, UserCircle, KeyRound, Wifi, WifiOff } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { checkApiKeyStatus } from './actions';

const adminChangeNameSchema = z.object({
  newAdminName: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
});
type AdminChangeNameFormValues = z.infer<typeof adminChangeNameSchema>;

// Diagnostic component to check for the API key on the server
function ApiKeyStatusChecker() {
  const [status, setStatus] = useState<'checking' | 'detected' | 'not-detected'>('checking');

  useEffect(() => {
    checkApiKeyStatus().then(result => {
      setStatus(result.hasKey ? 'detected' : 'not-detected');
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card/50 p-4 sm:flex-row sm:items-center">
        <div className="flex-1 space-y-1">
            <h4 className="font-semibold">Server API Key Status</h4>
            <p className="text-sm text-muted-foreground">
                Checks if the server can access the key from your `.env.local` file.
                {status === 'not-detected' && (
                    <span className="mt-1 block font-medium text-destructive">
                        Action Required: Please ensure your `.env.local` file is saved in the project root and restart the development server.
                    </span>
                )}
            </p>
        </div>
        <div>
            {status === 'checking' && <Badge variant="secondary" className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Checking...</Badge>}
            {status === 'detected' && <Badge className="bg-green-600/20 text-green-800 dark:bg-green-500/20 dark:text-green-300 hover:bg-green-600/30 flex items-center gap-2"><Wifi className="h-4 w-4" />Detected</Badge>}
            {status === 'not-detected' && <Badge variant="destructive" className="flex items-center gap-2"><WifiOff className="h-4 w-4" />Not Detected</Badge>}
        </div>
    </div>
  );
}

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

  const [apiKey, setApiKey] = useState('');
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem('googleApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    setIsSavingApiKey(true);
    localStorage.setItem('googleApiKey', apiKey);
    toast({
      title: 'API Key Saved',
      description: "Your API key has been saved to your browser's local storage.",
    });
    setIsSavingApiKey(false);
  };


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

  return (
    <>
      <Accordion type="multiple" defaultValue={['api-key', 'admin-account']} className="w-full space-y-4 mt-6">
        {/* API Key Management Section */}
        <AccordionItem value="api-key" className="border-none rounded-lg overflow-hidden shadow-md glassmorphism-card">
          <AccordionTrigger className="p-4 hover:no-underline w-full text-left">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              <h3 className="text-lg font-semibold">API Key Management</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4">
            <div className="space-y-6">
              <ApiKeyStatusChecker />

              <div className="space-y-2">
                <Label htmlFor="apiKeyInput">Google AI API Key (for convenience)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="apiKeyInput"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Google AI API key"
                  />
                  <Button onClick={handleSaveApiKey} disabled={isSavingApiKey}>
                    {isSavingApiKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Key
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Saves the key to your browser's local storage. This does not fix server errors.
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
                <h4 className="font-semibold">Important: How to Fix Server AI Errors</h4>
                <p className="text-sm">
                  For server-side AI features to work, please follow these steps carefully:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                        In the file explorer, ensure you have a file named exactly <code className="font-mono text-sm font-semibold rounded-sm bg-amber-500/20 px-1.5 py-1">.env.local</code>. It must be in the project's root directory (at the same level as `package.json`).
                    </li>
                    <li>
                        Add the following line to that file, pasting your own key:
                        <pre className="mt-2 rounded-md bg-amber-500/20 p-3 text-sm">
                            <code>GOOGLE_API_KEY={apiKey || 'YOUR_API_KEY_HERE'}</code>
                        </pre>
                    </li>
                    <li>
                        <span className="font-bold">You must restart the development server.</span> Use the restart button (🔄) at the top of the preview panel for the change to take effect.
                    </li>
                </ol>
                <p className="text-sm mt-2">After restarting, the "Server API Key Status" above should change to "Detected".</p>
              </div>
            </div>
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
                  {isSavingRate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Rate
                </Button>
              </div>
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
                          {isSavingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

    