
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth, MOCK_VIEWER_PASSWORD } from '@/contexts/auth-context'; // Import MOCK_VIEWER_PASSWORD
import { updateCustomerEmail } from '@/lib/mock-data-store';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

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
  const { user, loading, updateUserEmail: updateUserEmailInAuth } = useAuth();
  const { toast } = useToast();
  const [isEmailSaving, setIsEmailSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API call

    // Mock update
    updateUserEmailInAuth(values.newEmail); // Updates AuthContext and localStorage
    updateCustomerEmail(user.customerId, values.newEmail); // Updates mock-data-store

    toast({ title: "Email Updated (Mock)", description: `Your email has been updated to ${values.newEmail} for this session.` });
    emailForm.reset();
    setIsEmailSaving(false);
  };

  const handlePasswordChange = async (values: ChangePasswordFormValues) => {
    setIsPasswordSaving(true);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API call

    if (values.currentPassword === MOCK_VIEWER_PASSWORD) {
      toast({ title: "Password Changed (Mock)", description: "Your password has been successfully updated (simulated)." });
      passwordForm.reset();
    } else {
      toast({ variant: "destructive", title: "Error", description: "Incorrect current password." });
    }
    setIsPasswordSaving(false);
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
      <PageHeader title="My Profile" description="View and manage your account details." />
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-md">
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

        <Card className="shadow-md">
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
        
        <Card className="shadow-md lg:col-span-2">
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
    </>
  );
}
