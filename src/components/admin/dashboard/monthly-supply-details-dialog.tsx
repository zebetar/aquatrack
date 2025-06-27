
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CustomerMonthlyUsage } from "@/types";
import { format } from "date-fns";
import { formatDurationFromHours } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface MonthlySupplyDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: CustomerMonthlyUsage[];
  isLoading: boolean;
}

export function MonthlySupplyDetailsDialog({ isOpen, onClose, data, isLoading }: MonthlySupplyDetailsDialogProps) {
  const currentMonthYear = format(new Date(), "MMMM yyyy");

  const dialogContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading customer details...</p>
        </div>
      );
    }
    if (data.length > 0) {
      return (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3 hover:bg-muted/60 transition-colors">
              <div className="truncate pr-4">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatDurationFromHours(item.usageHours)}</p>
              </div>
              <p className="font-semibold text-primary whitespace-nowrap">PKR {item.cost.toLocaleString('en-US')}</p>
            </div>
          ))}
        </div>
      );
    }
    return (
      <p className="text-center text-muted-foreground py-4">
        No customer usage data for this month.
      </p>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg dialog-gradient-background">
        <DialogHeader className="pt-2">
          <DialogTitle>Monthly Water Supply - {currentMonthYear}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] w-full pr-4 mt-4">
          {dialogContent()}
        </ScrollArea>
        
        <DialogFooter className="mt-4">
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
