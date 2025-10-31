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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Customer, Payment } from "@/types";
import { useState } from "react";

const recordPaymentFormSchema = z.object({
  paymentDate: z.date({ required_error: "Payment date is required." }),
  amountPaid: z.coerce.number().positive({ message: "Amount must be positive." }),
});

type RecordPaymentFormValues = z.infer<typeof recordPaymentFormSchema>;

interface RecordPaymentFormProps {
  customer: Customer;
  onSuccess?: (newPayment: Omit<Payment, 'id' | 'createdAt' | 'recordedBy' | 'customerName'>) => void;
}

export function RecordPaymentForm({ customer, onSuccess }: RecordPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentFormSchema),
    defaultValues: {
      paymentDate: new Date(),
      amountPaid: customer.balance > 0 ? customer.balance : 0,
    },
  });

  async function onSubmit(values: RecordPaymentFormValues) {
    setIsLoading(true);
    
    const newPayment = {
      customerId: customer.id,
      paymentDate: values.paymentDate,
      amountPaid: values.amountPaid,
    };
    
    onSuccess?.(newPayment);

    setIsLoading(false);
    form.reset({
        paymentDate: new Date(),
        amountPaid: 0, 
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Payment</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amountPaid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount Paid (PKR)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 1200" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-sm text-muted-foreground">
            Current Balance: PKR {customer.balance.toLocaleString('en-US')}
        </p>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
          Record Payment
        </Button>
      </form>
    </Form>
  );
}
