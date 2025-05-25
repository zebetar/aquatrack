
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CustomerMonthlyUsage } from "@/types";
import { format } from "date-fns";

interface MonthlyRevenueDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: CustomerMonthlyUsage[]; // Reuses CustomerMonthlyUsage, where 'cost' is revenue from that customer
}

export function MonthlyRevenueDetailsDialog({ isOpen, onClose, data }: MonthlyRevenueDetailsDialogProps) {
  const currentMonthYear = format(new Date(), "MMMM yyyy");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glassmorphism-card">
        <DialogHeader>
          <DialogTitle>Monthly Revenue by Customer - {currentMonthYear}</DialogTitle>
          <DialogDescription>
            Revenue generated from each customer for the current month.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] w-full pr-4 mt-4">
          {data.length > 0 ? (
            <Table>
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
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No revenue generated from customers this month.
            </p>
          )}
        </ScrollArea>
        
        <DialogFooter className="mt-4">
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    