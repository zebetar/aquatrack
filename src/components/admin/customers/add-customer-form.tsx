
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
    
    // Base customer object with required fields.
    // This prevents sending 'undefined' values to Firestore, which is not allowed.
    const newCustomer: Customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: values.name,
      createdAt: new Date(),
      balance: 0,
    };

    // Conditionally add optional fields only if they have a value.
    const customerEmail = values.email?.trim();
    if (customerEmail) {
      newCustomer.email = customerEmail.toLowerCase();
      newCustomer.authUID = `authuid-${Math.random().toString(36).substring(2, 9)}`;
    }

    const contactInfo = values.contactInfo?.trim();
    if (contactInfo) {
      newCustomer.contactInfo = contactInfo;
    }
    
    // The newCustomer object is now clean and ready for Firestore.
    // The parent component will handle the actual database call.
    
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
