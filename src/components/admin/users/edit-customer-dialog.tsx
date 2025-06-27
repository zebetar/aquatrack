"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { Customer } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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

const editCustomerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
  email: z.string().email({ message: "Please enter a valid email." }).trim().toLowerCase().optional().or(z.literal('')),
  contactInfo: z.string().trim().optional(),
});

type EditCustomerFormValues = z.infer<typeof editCustomerFormSchema>;

interface EditCustomerDialogProps {
  customer: Customer;
  onCustomerUpdated: (customer: Customer) => void;
  triggerButton?: React.ReactNode;
}

export function EditCustomerDialog({ customer, onCustomerUpdated, triggerButton }: EditCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditCustomerFormValues>({
    resolver: zodResolver(editCustomerFormSchema),
    defaultValues: {
      name: customer.name || "",
      email: customer.email || "",
      contactInfo: customer.contactInfo || "",
    },
  });

  // Function to reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: customer.name || "",
        email: customer.email || "",
        contactInfo: customer.contactInfo || "",
      });
    }
  }, [open, customer, form]);

  async function onSubmit(values: EditCustomerFormValues) {
    setIsLoading(true);

    const updatedCustomer: Customer = {
      ...customer,
      name: values.name,
      contactInfo: values.contactInfo || undefined,
      email: values.email || undefined,
    };
    
    // If email is provided, ensure authUID exists. If not, create one.
    if (updatedCustomer.email && !updatedCustomer.authUID) {
      updatedCustomer.authUID = `authuid-${Math.random().toString(36).substring(2, 9)}`;
    }
    // If email is removed, remove authUID as well.
    if (!updatedCustomer.email) {
      updatedCustomer.authUID = undefined;
    }

    onCustomerUpdated(updatedCustomer);
    toast({
      title: "Customer Updated",
      description: `${values.name}'s details have been updated.`,
    });
    setIsLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton ? (
          triggerButton
        ) : (
          <Button variant="ghost" size="icon" title="Edit Customer" onClick={(e) => e.stopPropagation()}>
            <Pencil className="h-4 w-4 text-primary" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Customer: {customer.name}</DialogTitle>
        </DialogHeader>
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
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
