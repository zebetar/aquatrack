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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const addCustomerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email for viewer account." }).optional().or(z.literal('')),
  contactInfo: z.string().optional(),
});

type AddCustomerFormValues = z.infer<typeof addCustomerFormSchema>;

interface AddCustomerFormProps {
  onSuccess?: () => void;
}

export function AddCustomerForm({ onSuccess }: AddCustomerFormProps) {
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
    // Here you would typically call a server action or API endpoint
    // This would involve creating a customer document in Firestore
    // and potentially a Firebase Auth user if email is provided for a viewer account.
    console.log("Add Customer Data:", values);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Customer Added Successfully!",
      description: `${values.name} has been added to the system.`,
    });
    setIsLoading(false);
    onSuccess?.();
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
              <FormLabel>Email (for Viewer Account)</FormLabel>
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
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Customer
        </Button>
      </form>
    </Form>
  );
}
