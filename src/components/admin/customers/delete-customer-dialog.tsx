
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
import { deleteCustomer } from "@/lib/firebase-service";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DeleteCustomerDialogProps {
  customer: Customer;
  onDeleteConfirm: (customerId: string) => void;
  isDeleting: boolean;
  triggerButton?: React.ReactNode;
}

export function DeleteCustomerDialog({ 
  customer, 
  onDeleteConfirm,
  triggerButton 
}: DeleteCustomerDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        await deleteCustomer(customer.id);
        toast({ title: "Customer Deleted", description: `${customer.name} and all their data have been removed.` });
        onDeleteConfirm(customer.id);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete customer." });
    } finally {
        setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {triggerButton ? triggerButton : (
          <Button variant="ghost" size="icon" title="Delete Customer" disabled={isDeleting} onClick={(e) => { e.stopPropagation(); }}>
            {isDeleting ? <Droplets className="h-4 w-4 animate-pulse-subtle" /> : <Trash2 className="h-4 w-4 text-destructive" />}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the customer account for 
            <span className="font-semibold"> {customer.name}</span> and remove all associated data from Firestore.
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
