
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Droplets } from "lucide-react";
import type { Customer } from "@/types";

interface DeleteCustomerDialogProps {
  customer: Customer;
  onDeleteConfirm: (customerId: string) => void;
  isDeleting: boolean;
  triggerButton?: React.ReactNode; // Optional custom trigger
}

export function DeleteCustomerDialog({ 
  customer, 
  onDeleteConfirm,
  isDeleting,
  triggerButton 
}: DeleteCustomerDialogProps) {
  
  const handleDelete = () => {
    onDeleteConfirm(customer.id);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {triggerButton ? triggerButton : (
          <Button variant="ghost" size="icon" title="Delete Customer" disabled={isDeleting} onClick={(e) => e.stopPropagation()}>
            {isDeleting ? <Droplets className="h-4 w-4 animate-pulse-subtle" /> : <Trash2 className="h-4 w-4 text-destructive" />}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the customer account for 
            <span className="font-semibold"> {customer.name}</span> and remove all associated data, including water usage and payment records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
