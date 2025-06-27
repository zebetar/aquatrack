
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
import type { Customer } from "@/types";
import Link from "next/link";

interface OutstandingBillsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: Customer[];
}

export function OutstandingBillsDialog({ isOpen, onClose, data }: OutstandingBillsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg dialog-gradient-background">
        <DialogHeader className="pt-2">
          <DialogTitle>Outstanding Bills</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] w-full pr-4 mt-4">
          {data.length > 0 ? (
             <div className="space-y-2">
              {data.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3 hover:bg-muted/60 transition-colors">
                  <p className="font-medium truncate pr-4">{customer.name}</p>
                  <p className="font-semibold text-destructive whitespace-nowrap">PKR {customer.balance.toLocaleString('en-US')}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No customers currently have outstanding bills.
            </p>
          )}
        </ScrollArea>
        
        <DialogFooter className="mt-4 justify-between">
          <Button variant="outline" asChild>
            <Link href="/admin/reports/outstanding-bills" onClick={onClose}>View Full Report</Link>
          </Button>
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
