"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Droplets } from "lucide-react";
import { LogUsageForm } from "./log-usage-form";
import type { Customer } from "@/types";
import { useState } from "react";

interface LogUsageDialogProps {
  customer: Customer;
}

export function LogUsageDialog({ customer }: LogUsageDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Droplets className="mr-2 h-4 w-4" /> Log Water Usage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Water Usage for {customer.name}</DialogTitle>
          <DialogDescription>
            Enter the date, start time, and end time of water supply.
          </DialogDescription>
        </DialogHeader>
        <LogUsageForm customer={customer} onSuccess={() => setOpen(false)} />
        {/* DialogClose is handled by form's onSuccess or manually */}
      </DialogContent>
    </Dialog>
  );
}
