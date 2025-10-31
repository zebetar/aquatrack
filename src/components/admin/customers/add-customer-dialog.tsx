
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { AddCustomerForm } from "./add-customer-form";
import { useState } from "react";
import type { Customer } from "@/types";

interface AddCustomerDialogProps {
  onCustomerAdded: (customer: Omit<Customer, 'id' | 'createdAt' | 'balance'> & { email: string }) => void;
}

export function AddCustomerDialog({ onCustomerAdded }: AddCustomerDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (newCustomer: Omit<Customer, 'id' | 'createdAt' | 'balance'> & { email: string }) => {
    onCustomerAdded(newCustomer);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            This will create a customer profile and send them an email invitation to set their password and log in.
          </DialogDescription>
        </DialogHeader>
        <AddCustomerForm onSuccessCallback={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
