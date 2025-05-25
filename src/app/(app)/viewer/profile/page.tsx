
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth, MOCK_VIEWER_PASSWORD } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Eye, EyeOff, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

const changeEmailSchema = z.object({
  newEmail: z.string().email({ message: "Please enter a valid email address." }),
});
type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ViewerProfilePage() {
  const { user, loading, updateUserEmail: updateUserEmailInAuth, updateUserAvatarUrl } = useAuth();
  const { toast } = useToast();
  const [isEmailSaving, setIsEmailSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    setAvatarPreview(user?.avatarUrl || null);
  }, [user?.avatarUrl]);

  const emailForm = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "" },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <p>Not authenticated.</p>;
  }

  const handleEmailChange = async (values: ChangeEmailFormValues) => {
    if (!user || !user.customerId) return;
    setIsEmailSaving(true);
    await new Promise(resolve => setTimeout(resolve, 700));

    updateUserEmailInAuth(values.newEmail);

    toast({ title: "Email Updated", description: `Your email has been updated to ${values.newEmail}.` });
    emailForm.reset();
    setIsEmailSaving(false);
  };

  const handlePasswordChange = async (values: ChangePasswordFormValues) => {
    setIsPasswordSaving(true);
    await new Promise(resolve => setTimeout(resolve, 700));

    if (values.currentPassword === MOCK_VIEWER_PASSWORD) {
      toast({ title: "Password Changed (Mock)", description: "Your password has been successfully updated (simulated)." });
      passwordForm.reset();
    } else {
      toast({ variant: "destructive", title: "Error", description: "Incorrect current password." });
    }
    setIsPasswordSaving(false);
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
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

  const handleAvatarChange = async () => {
    if (!avatarPreview && !user?.avatarUrl) {
        toast({ title: "No Image", description: "Please select an image to update your avatar." });
        return;
    }
     if (avatarPreview === user?.avatarUrl) {
        toast({ title: "No Change", description: "The selected image is the same as your current avatar." });
        return;
    }
    setIsAvatarSaving(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    updateUserAvatarUrl(avatarPreview);
    setIsAvatarSaving(false);
  };
  
  const handleClearAvatarPreview = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
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
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mt-6">
      <Card className="shadow-md glassmorphism-card">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your personal and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={user.name || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Current Email</Label>
            <Input id="email" type="email" value={user.email} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer ID</Label>
            <Input id="customerId" defaultValue={user.customerId || 'N/A'} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md glassmorphism-card">
        <CardHeader>
          <CardTitle>Change Avatar</CardTitle>
          <CardDescription>Upload a new profile picture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <p className="text-sm text-muted-foreground">Select a PNG, JPG, or GIF image (max 2MB).</p>
          <div className="flex gap-2">
              <Button onClick={handleAvatarChange} disabled={isAvatarSaving}>
                  {isAvatarSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Save Avatar
              </Button>
              {avatarPreview && (
                  <Button variant="outline" onClick={handleClearAvatarPreview} disabled={isAvatarSaving}>
                      Clear Preview
                  </Button>
              )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md glassmorphism-card">
        <CardHeader>
          <CardTitle>Change Email</CardTitle>
          <CardDescription>Update the email address associated with your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleEmailChange)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="new.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isEmailSaving}>
                {isEmailSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Email
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-md glassmorphism-card">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your login password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
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
                control={passwordForm.control}
                name="newPassword"
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
                control={passwordForm.control}
                name="confirmPassword"
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
              <Button type="submit" disabled={isPasswordSaving}>
                {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
