
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { Customer } from "@/types";

const addCustomerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
  email: z.string().email({ message: "Please enter a valid email." }).trim().toLowerCase().optional().or(z.literal('')),
  contactInfo: z.string().trim().optional(),
});

type AddCustomerFormValues = z.infer<typeof addCustomerFormSchema>;

interface AddCustomerFormProps {
  onSuccessCallback: (customer: Customer) => void;
}

export function AddCustomerForm({ onSuccessCallback }: AddCustomerFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddCustomerFormValues>({
    resolver: zodResolver(addCustomerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      contactInfo: "",
    },
  });

  async function onSubmit(values: AddCustomerFormValues) {
    setIsLoading(true);
    
    // Ensure email is undefined if it's an empty string after Zod processing, otherwise use the processed value.
    const customerEmail = values.email && values.email.length > 0 ? values.email : undefined;

    const newCustomer: Customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: values.name,
      email: customerEmail, // Use the processed email
      contactInfo: values.contactInfo || undefined,
      // Generate authUID only if customerEmail is a valid, non-empty string
      authUID: customerEmail ? `authuid-${Math.random().toString(36).substring(2, 9)}` : undefined,
      createdAt: new Date(),
      balance: 0,
    };
    
    toast({
      title: "Customer Added Successfully!",
      description: `${newCustomer.name} has been added. ${newCustomer.email ? `Login email: ${newCustomer.email}` : 'No login email set.'}`,
    });
    setIsLoading(false);
    onSuccessCallback(newCustomer); 
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <Input type="email" placeholder="viewer@example.com (optional)" {...field} />
              </FormControl>
              <FormDescription>
                If provided, this email will be used by the customer to log into their Viewer Dashboard. Use 'viewerpassword' as the password. This email is case-insensitive for login.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Info (Phone/Address)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 9876543210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Customer
        </Button>
      </form>
    </Form>
  );
}
