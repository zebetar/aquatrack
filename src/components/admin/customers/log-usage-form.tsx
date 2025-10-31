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
import { cn, formatDurationFromHours } from "@/lib/utils";
import { format, differenceInMinutes, set, addDays } from "date-fns";
import { CORE_WATER_RATE_PER_HOUR } from "@/lib/constants";
import type { Customer, WaterUsageRecord } from "@/types";
import { useState, useMemo } from "react";

const logUsageFormSchema = z.object({
  date: z.date({ required_error: "Date is required." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
}).refine(data => {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);

  let effectiveEndDate = new Date(data.date);
  if (endH < startH || (endH === startH && endM <= startM)) {
    effectiveEndDate = addDays(effectiveEndDate, 1);
  }

  const startDateTime = set(data.date, { hours: startH, minutes: startM, seconds: 0, milliseconds: 0 });
  const endDateTime = set(effectiveEndDate, { hours: endH, minutes: endM, seconds: 0, milliseconds: 0 });
  
  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    return false;
  }

  const diffMinutes = differenceInMinutes(endDateTime, startDateTime);
  return diffMinutes > 0 && diffMinutes <= 24 * 60; 
}, {
  message: "End time must be after start time. Max duration 24 hours.",
  path: ["endTime"],
});

type LogUsageFormValues = z.infer<typeof logUsageFormSchema>;

interface LogUsageFormProps {
  customer: Customer;
  onSuccess?: (newRecord: Omit<WaterUsageRecord, 'id' | 'createdAt' | 'recordedBy' | 'customerName'>) => void; 
}

export function LogUsageForm({ customer, onSuccess }: LogUsageFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LogUsageFormValues>({
    resolver: zodResolver(logUsageFormSchema),
    defaultValues: {
      date: new Date(),
      startTime: format(new Date(), "HH:mm"),
      endTime: format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
    },
    mode: "onChange", 
  });

  const { getValues, watch } = form;
  const watchedValues = watch(); 

  const calculatedMetrics = useMemo(() => {
    const currentValues = getValues();
    const parseResult = logUsageFormSchema.safeParse(currentValues);

    if (!parseResult.success || !currentValues.date || !currentValues.startTime || !currentValues.endTime) {
      return { durationHours: 0, cost: 0 };
    }
    
    const { date, startTime: startTimeStr, endTime: endTimeStr } = currentValues;
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const actualStartTime = set(new Date(date), { hours: startH, minutes: startM, seconds: 0, milliseconds: 0 });
    let actualEndTime = set(new Date(date), { hours: endH, minutes: endM, seconds: 0, milliseconds: 0 });
    
    if (actualEndTime <= actualStartTime) { 
      actualEndTime = addDays(actualEndTime, 1);
    }
    
    if (isNaN(actualStartTime.getTime()) || isNaN(actualEndTime.getTime()) || actualEndTime <= actualStartTime) {
      return { durationHours: 0, cost: 0 };
    }

    const durationMinutes = differenceInMinutes(actualEndTime, actualStartTime);
    const durationHours = durationMinutes / 60;
    const cost = durationHours * CORE_WATER_RATE_PER_HOUR;
    return { durationHours, cost };
  }, [watchedValues, getValues]); 

  const { durationHours, cost } = calculatedMetrics;
  
  const isFormCurrentlyValid = logUsageFormSchema.safeParse(watchedValues).success;

  async function onSubmit(values: LogUsageFormValues) {
    setIsLoading(true);
    
    const [startH, startM] = values.startTime.split(':').map(Number);
    const [endH, endM] = values.endTime.split(':').map(Number);
    const actualStartTime = set(new Date(values.date), { hours: startH, minutes: startM, seconds: 0, milliseconds: 0 });
    let actualEndTime = set(new Date(values.date), { hours: endH, minutes: endM, seconds: 0, milliseconds: 0 });

    if (actualEndTime <= actualStartTime) {
      actualEndTime = addDays(actualEndTime, 1);
    }
    
    const finalDurationMinutes = differenceInMinutes(actualEndTime, actualStartTime);
    const finalDurationHours = finalDurationMinutes / 60;
    const finalCost = finalDurationHours * CORE_WATER_RATE_PER_HOUR;

    const newUsageRecord = {
      customerId: customer.id,
      date: values.date,
      startTime: actualStartTime, 
      endTime: actualEndTime,  
      durationHours: finalDurationHours,
      cost: finalCost,
    };
    
    onSuccess?.(newUsageRecord);

    setIsLoading(false);
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
                <FormLabel>Start Time</FormLabel>
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
                <FormLabel>End Time</FormLabel>
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
                <span className="font-semibold">{formatDurationFromHours(durationHours)}</span>
            </div>
            <div className="flex justify-between">
                <span>Calculated Cost (PKR {CORE_WATER_RATE_PER_HOUR}/hr):</span>
                <span className="font-semibold">PKR {cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !isFormCurrentlyValid}>
          {isLoading && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
          Log Usage
        </Button>
      </form>
    </Form>
  );
}
