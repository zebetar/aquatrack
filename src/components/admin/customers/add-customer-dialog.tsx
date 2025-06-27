
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { AddCustomerForm } from "./add-customer-form";
import { useState } from "react";
import type { Customer } from "@/types";

interface AddCustomerDialogProps {
  onCustomerAdded: (customer: Customer) => void;
}

export function AddCustomerDialog({ onCustomerAdded }: AddCustomerDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (newCustomer: Customer) => {
    onCustomerAdded(newCustomer);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* On mobile, this becomes an icon button. On desktop, it has text. */}
        <Button className="w-10 h-10 p-0 md:w-auto md:h-auto md:px-4 md:py-2 relative">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden md:inline md:ml-2">Add New Customer</span>
          <span className="sr-only">Add New Customer</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <AddCustomerForm onSuccessCallback={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
