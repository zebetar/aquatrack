
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";
import { RecordPaymentForm } from "./record-payment-form";
import type { Customer, Payment } from "@/types";
import { useState } from "react";

interface RecordPaymentDialogProps {
  customer: Customer;
  onPaymentRecorded?: (newPayment: Payment) => void;
}

export function RecordPaymentDialog({ customer, onPaymentRecorded }: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (newPayment: Payment) => {
    onPaymentRecorded?.(newPayment);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button> {/* Primary button variant */}
          <CreditCard className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment for {customer.name}</DialogTitle>
          <DialogDescription>
            Enter the amount paid and the date of payment.
          </DialogDescription>
        </DialogHeader>
        <RecordPaymentForm customer={customer} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
