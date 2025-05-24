
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
import { format, differenceInMinutes, set, parse } from "date-fns";
import { CORE_WATER_RATE_PER_HOUR } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import type { Customer, WaterUsageRecord } from "@/types";
import { useState, useMemo } from "react";

const logUsageFormSchema = z.object({
  date: z.date({ required_error: "Date is required." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
}).refine(data => {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(data.startTime) || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(data.endTime)) {
    return true; 
  }
  const start = parse(data.startTime, "HH:mm", new Date());
  const end = parse(data.endTime, "HH:mm", new Date());
  return end > start;
}, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

type LogUsageFormValues = z.infer<typeof logUsageFormSchema>;

interface LogUsageFormProps {
  customer: Customer;
  onSuccess?: (newRecord: WaterUsageRecord) => void; 
}

export function LogUsageForm({ customer, onSuccess }: LogUsageFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LogUsageFormValues>({
    resolver: zodResolver(logUsageFormSchema),
    defaultValues: {
      date: new Date(),
      startTime: format(new Date(), "HH:mm"),
      endTime: format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
    },
    mode: "onChange", // Validate on change to update duration/cost display
  });

  const { watch, getValues, formState } = form;
  const watchedDate = watch("date");
  const watchedStartTime = watch("startTime");
  const watchedEndTime = watch("endTime");

  const calculatedMetrics = useMemo(() => {
    const currentValues = getValues();
    const parseResult = logUsageFormSchema.safeParse(currentValues);

    if (!parseResult.success || !currentValues.date || !currentValues.startTime || !currentValues.endTime) {
      return { durationHours: 0, cost: 0, actualStartTime: new Date(), actualEndTime: new Date(), isValid: false };
    }
    
    const [startH, startM] = currentValues.startTime.split(':').map(Number);
    const [endH, endM] = currentValues.endTime.split(':').map(Number);

    const actualStartTime = set(new Date(currentValues.date), { hours: startH, minutes: startM, seconds: 0, milliseconds: 0 });
    const actualEndTime = set(new Date(currentValues.date), { hours: endH, minutes: endM, seconds: 0, milliseconds: 0 });
    
    if (actualEndTime <= actualStartTime) {
      return { durationHours: 0, cost: 0, actualStartTime, actualEndTime, isValid: false };
    }

    const durationMinutes = differenceInMinutes(actualEndTime, actualStartTime);
    const durationHours = durationMinutes / 60;
    const cost = durationHours * CORE_WATER_RATE_PER_HOUR;
    return { durationHours, cost, actualStartTime, actualEndTime, isValid: true };
  }, [watchedDate, watchedStartTime, watchedEndTime, getValues]);

  const { durationHours, cost } = calculatedMetrics;

  async function onSubmit(values: LogUsageFormValues) {
    setIsLoading(true);
    
    // Re-calculate with final values from validated form to be absolutely sure
    const finalCalculation = (() => {
        const [startH, startM] = values.startTime.split(':').map(Number);
        const [endH, endM] = values.endTime.split(':').map(Number);
        const actualStartTime = set(new Date(values.date), { hours: startH, minutes: startM, seconds: 0, milliseconds: 0 });
        const actualEndTime = set(new Date(values.date), { hours: endH, minutes: endM, seconds: 0, milliseconds: 0 });
        if (actualEndTime <= actualStartTime) return { durationHours: 0, cost: 0, actualStartTime, actualEndTime };
        const durationMinutes = differenceInMinutes(actualEndTime, actualStartTime);
        const durationHours = durationMinutes / 60;
        const cost = durationHours * CORE_WATER_RATE_PER_HOUR;
        return { durationHours, cost, actualStartTime, actualEndTime };
    })();


    const newUsageRecord: WaterUsageRecord = {
      id: `usage-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      customerId: customer.id,
      customerName: customer.name,
      date: values.date, 
      startTime: finalCalculation.actualStartTime, 
      endTime: finalCalculation.actualEndTime,  
      durationHours: finalCalculation.durationHours,
      cost: finalCalculation.cost,
      recordedBy: "admin001", 
      createdAt: new Date(),
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Usage Logged Successfully!",
      description: `Logged ${finalCalculation.durationHours.toFixed(2)} hours for ${customer.name}. Cost: PKR ${finalCalculation.cost.toLocaleString('en-US')}.`,
    });
    setIsLoading(false);
    onSuccess?.(newUsageRecord); 
    form.reset({ 
        date: new Date(),
        startTime: format(new Date(), "HH:mm"),
        endTime: format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
    });
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
                <span>Calculated Cost (PKR {CORE_WATER_RATE_PER_HOUR}/hr):</span>
                <span className="font-semibold">PKR {cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !formState.isValid}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log Usage
        </Button>
      </form>
    </Form>
  );
}
