
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
      <DialogContent className="sm:max-w-lg glassmorphism-card">
        <DialogHeader>
          <DialogTitle>Customers with Outstanding Bills</DialogTitle>
          <DialogDescription>
            List of customers who have a pending balance.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] w-full pr-4 mt-4">
          {data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="text-right">Outstanding Balance (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right">{customer.balance.toLocaleString('en-US')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
