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
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInMinutes, set } from "date-fns";
import { CORE_WATER_RATE_PER_HOUR } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/types";
import { useState } from "react";

const logUsageFormSchema = z.object({
  date: z.date({ required_error: "Date is required." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
}).refine(data => {
  const start = new Date(`2000-01-01T${data.startTime}:00`);
  const end = new Date(`2000-01-01T${data.endTime}:00`);
  return end > start;
}, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

type LogUsageFormValues = z.infer<typeof logUsageFormSchema>;

interface LogUsageFormProps {
  customer: Customer;
  onSuccess?: () => void; // Callback for successful submission
}

export function LogUsageForm({ customer, onSuccess }: LogUsageFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LogUsageFormValues>({
    resolver: zodResolver(logUsageFormSchema),
    defaultValues: {
      date: new Date(),
      startTime: format(new Date(), "HH:mm"),
      endTime: format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"), // Default to 1 hour later
    },
  });

  const { watch } = form;
  const watchedDate = watch("date");
  const watchedStartTime = watch("startTime");
  const watchedEndTime = watch("endTime");

  const calculateDurationAndCost = () => {
    if (!watchedDate || !watchedStartTime || !watchedEndTime || !logUsageFormSchema.safeParse(form.getValues()).success) {
      return { durationHours: 0, cost: 0 };
    }
    
    const [startH, startM] = watchedStartTime.split(':').map(Number);
    const [endH, endM] = watchedEndTime.split(':').map(Number);

    const startDate = set(new Date(watchedDate), { hours: startH, minutes: startM, seconds: 0, milliseconds: 0 });
    const endDate = set(new Date(watchedDate), { hours: endH, minutes: endM, seconds: 0, milliseconds: 0 });
    
    if (endDate <= startDate) return { durationHours: 0, cost: 0 };

    const durationMinutes = differenceInMinutes(endDate, startDate);
    const durationHours = durationMinutes / 60;
    const cost = durationHours * CORE_WATER_RATE_PER_HOUR;
    return { durationHours, cost };
  };

  const { durationHours, cost } = calculateDurationAndCost();

  async function onSubmit(values: LogUsageFormValues) {
    setIsLoading(true);
    // Here you would typically call a server action or API endpoint
    // For demo, simulate success and show a toast
    console.log("Log Usage Data:", { ...values, customerId: customer.id, durationHours, cost });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Usage Logged Successfully!",
      description: `Logged ${durationHours.toFixed(2)} hours for ${customer.name}. Cost: ₹${cost.toLocaleString('en-IN')}.`,
    });
    setIsLoading(false);
    onSuccess?.(); // Call the onSuccess callback if provided (e.g., to close dialog)
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time (HH:MM)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time (HH:MM)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="mt-4 space-y-2 rounded-md border bg-muted p-3 text-sm">
            <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-semibold">{durationHours.toFixed(2)} hours</span>
            </div>
            <div className="flex justify-between">
                <span>Calculated Cost (₹{CORE_WATER_RATE_PER_HOUR}/hr):</span>
                <span className="font-semibold">₹{cost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log Usage
        </Button>
      </form>
    </Form>
  );
}
