
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
import { Droplets } from "lucide-react";
import { useState } from "react";
import type { Customer } from "@/types";

const addCustomerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
  email: z.string().email({ message: "A valid email is required for login." }).trim().toLowerCase(),
  contactInfo: z.string().trim().optional(),
});

type AddCustomerFormValues = z.infer<typeof addCustomerFormSchema>;

interface AddCustomerFormProps {
  onSuccessCallback: (customer: Omit<Customer, 'id' | 'createdAt' | 'balance'> & { email: string }) => void;
}

export function AddCustomerForm({ onSuccessCallback }: AddCustomerFormProps) {
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
    
    // The email is now required by the schema, so we can assert it.
    const newCustomer: Omit<Customer, 'id' | 'createdAt' | 'balance'> & { email: string } = {
      name: values.name,
      email: values.email!,
      contactInfo: values.contactInfo || undefined,
    };
    
    onSuccessCallback(newCustomer); 
    
    // The parent dialog will handle loading state and closing.
    // We can keep the form in a loading state until the process is complete.
    // If you want the form to reset, the parent must handle it.
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
                <Input type="email" placeholder="viewer@example.com" {...field} />
              </FormControl>
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
                <Input placeholder="e.g., 9876543210 (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
          Add Customer & Send Invite
        </Button>
      </form>
    </Form>
  );
}
