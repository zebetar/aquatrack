
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Droplets, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { Customer } from "@/types";
import { checkEmailExists } from "@/lib/firebase-service";
import { useFirebase } from "@/contexts/firebase-context";


const addCustomerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
  email: z.string().email({ message: "A valid email is required for login." }).trim().toLowerCase(),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});


type AddCustomerFormValues = z.infer<typeof addCustomerFormSchema>;

interface AddCustomerFormProps {
  onSuccessCallback: (customer: Omit<Customer, 'id' | 'createdAt' | 'balance' | 'authUID'>, password: string) => Promise<void>;
}

export function AddCustomerForm({ onSuccessCallback }: AddCustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { auth } = useFirebase();

  const form = useForm<AddCustomerFormValues>({
    resolver: async (data, context, options) => {
        const schemaResult = await zodResolver(addCustomerFormSchema)(data, context, options);
        if (!auth || !data.email || !schemaResult.errors.email) {
            return schemaResult;
        }

        const emailExists = await checkEmailExists(auth, data.email);
        if (emailExists) {
            const fieldErrors = schemaResult.errors;
            if (!fieldErrors.email) {
                fieldErrors.email = { type: 'manual', message: '' };
            }
            fieldErrors.email.message = 'This email is already in use. Please use a different email.';
             return {
                values: data,
                errors: fieldErrors,
            };
        }
        return schemaResult;
    },
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: 'onBlur', // Validate on blur to check email
  });

  async function onSubmit(values: AddCustomerFormValues) {
    setIsLoading(true);
    
    const newCustomer: Omit<Customer, 'id' | 'createdAt' | 'balance' | 'authUID'> = {
      name: values.name,
      email: values.email,
    };
    
    try {
        await onSuccessCallback(newCustomer, values.password); 
    } catch (error) {
        // Parent will show toast. We just need to stop loading.
        setIsLoading(false);
    }
  }
  
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
    </Button>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (for Viewer Account Login)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="viewer@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Set Initial Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                </FormControl>
                <PasswordVisibilityToggle isVisible={showPassword} toggle={() => setShowPassword(!showPassword)} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                </FormControl>
                 <PasswordVisibilityToggle isVisible={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
          Add Customer & Create Account
        </Button>
      </form>
    </Form>
  );
}
