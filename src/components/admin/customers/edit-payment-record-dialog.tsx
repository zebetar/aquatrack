
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { EditPaymentRecordForm } from "./edit-payment-record-form";
import type { Payment } from "@/types";
import { useState } from "react";

interface EditPaymentRecordDialogProps {
  paymentRecord: Payment;
  onPaymentRecordUpdated: (updatedPayment: Payment) => void;
  triggerButton?: React.ReactNode;
}

export function EditPaymentRecordDialog({ paymentRecord, onPaymentRecordUpdated, triggerButton }: EditPaymentRecordDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (updatedPayment: Payment) => {
    onPaymentRecordUpdated(updatedPayment);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="ghost" size="icon" title="Edit Payment Record">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Payment for {paymentRecord.customerName}</DialogTitle>
        </DialogHeader>
        <EditPaymentRecordForm existingPayment={paymentRecord} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
