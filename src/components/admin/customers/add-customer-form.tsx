
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
  email: z.string().email({ message: "Please enter a valid email." }).trim().toLowerCase().optional().or(z.literal('')),
  contactInfo: z.string().trim().optional(),
});

type AddCustomerFormValues = z.infer<typeof addCustomerFormSchema>;

interface AddCustomerFormProps {
  onSuccessCallback: (customer: Omit<Customer, 'id' | 'createdAt' | 'balance'>) => void;
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
    
    const newCustomer: Omit<Customer, 'id' | 'createdAt' | 'balance'> = {
      name: values.name,
    };

    if (values.email) {
      newCustomer.email = values.email;
    }
    if (values.contactInfo) {
      newCustomer.contactInfo = values.contactInfo;
    }
    
    onSuccessCallback(newCustomer); 
    
    setIsLoading(false);
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
          {isLoading && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
          Add Customer
        </Button>
      </form>
    </Form>
  );
}
