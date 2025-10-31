
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Droplets, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';

const changeEmailSchema = z.object({
  newEmail: z.string().email({ message: "Please enter a valid email address." }),
  currentPasswordForEmail: z.string().min(1, { message: "Password is required to change email." }),
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
  const { user, loading, updateUserEmail, updateUserPassword } = useAuth();
  const { toast } = useToast();
  const [isEmailSaving, setIsEmailSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPasswordForEmail, setShowCurrentPasswordForEmail] = useState(false);

  const emailForm = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "", currentPasswordForEmail: "" },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Droplets className="h-8 w-8 animate-pulse-subtle text-primary" />
      </div>
    );
  }

  if (!user) {
    return <p>Not authenticated.</p>;
  }

  const handleEmailChange = async (values: ChangeEmailFormValues) => {
    setIsEmailSaving(true);
    const result = await updateUserEmail(values.newEmail, values.currentPasswordForEmail);
    if (result.success) {
      emailForm.reset();
    }
    setIsEmailSaving(false);
  };

  const handlePasswordChange = async (values: ChangePasswordFormValues) => {
    setIsPasswordSaving(true);
    const result = await updateUserPassword(values.currentPassword, values.newPassword);
    if (result.success) {
      passwordForm.reset();
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
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mt-6">
      <Card className="shadow-md glassmorphism-card">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
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
          <CardTitle>Change Email</CardTitle>
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
              <FormField
                control={emailForm.control}
                name="currentPasswordForEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type={showCurrentPasswordForEmail ? "text" : "password"} placeholder="••••••••" {...field} className="pr-10" />
                      </FormControl>
                      <PasswordVisibilityToggle isVisible={showCurrentPasswordForEmail} toggle={() => setShowCurrentPasswordForEmail(!showCurrentPasswordForEmail)} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isEmailSaving}>
                {isEmailSaving && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
                Change Email
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-md glassmorphism-card lg:col-span-2">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
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
                {isPasswordSaving && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
                Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
