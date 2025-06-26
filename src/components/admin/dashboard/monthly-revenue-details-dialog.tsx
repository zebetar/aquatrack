
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CustomerMonthlyUsage } from "@/types";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface MonthlyRevenueDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: CustomerMonthlyUsage[]; 
  isLoading: boolean;
}

export function MonthlyRevenueDetailsDialog({ isOpen, onClose, data, isLoading }: MonthlyRevenueDetailsDialogProps) {
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
        <Table className="min-w-[400px]">
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead className="text-right">Revenue (PKR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">{item.cost.toLocaleString('en-US')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    return (
      <p className="text-center text-muted-foreground py-4">
        No revenue generated from customers this month.
      </p>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg dialog-gradient-background">
        <DialogHeader className="pt-2">
          <DialogTitle>Monthly Revenue - {currentMonthYear}</DialogTitle>
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
    
