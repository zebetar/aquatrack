
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { AddCustomerForm } from "./add-customer-form";
import { useState } from "react";
import type { Customer } from "@/types";

interface AddCustomerDialogProps {
  onCustomerAdded: (customer: Omit<Customer, 'id' | 'createdAt' | 'balance' | 'authUID'>, password: string) => Promise<void>;
}

export function AddCustomerDialog({ onCustomerAdded }: AddCustomerDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = async (newCustomer: Omit<Customer, 'id' | 'createdAt' | 'balance' | 'authUID'>, password: string) => {
    await onCustomerAdded(newCustomer, password);
    // Only close the dialog if the parent onCustomerAdded function resolves successfully
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
            This creates a customer profile and a viewer account with the password you set.
          </DialogDescription>
        </DialogHeader>
        <AddCustomerForm onSuccessCallback={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
