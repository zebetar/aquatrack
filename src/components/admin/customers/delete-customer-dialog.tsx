
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
import { 
    deleteCustomer, 
    getUsageRecordsByCustomerId, 
    getPaymentsByCustomerId 
} from "@/lib/firebase-service";
import { generateCustomerPdf } from '@/lib/generate-customer-pdf';
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
    toast({
      title: "Deletion in Progress",
      description: "Generating final PDF statement before deleting customer...",
    });

    try {
        // 1. Fetch all data for the PDF
        const usageRecords = await getUsageRecordsByCustomerId(customer.id);
        const payments = await getPaymentsByCustomerId(customer.id);

        // 2. Generate and trigger download of the PDF
        await generateCustomerPdf(customer, usageRecords, payments);
        
        // 3. Proceed with deletion
        await deleteCustomer(customer.id);
        
        toast({ 
            title: "Customer Deleted", 
            description: `${customer.name}'s final statement has been downloaded and their data has been removed.` 
        });

        // 4. Confirm deletion to parent component
        onDeleteConfirm(customer.id);

    } catch (error) {
        console.error("Failed to delete customer or generate PDF:", error);
        toast({ 
            variant: "destructive", 
            title: "Error", 
            description: "Failed to delete customer. Please check the console for details." 
        });
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
            This action will first download a final PDF statement for 
            <span className="font-semibold"> {customer.name}</span>, then permanently delete their account and all associated data. This cannot be undone.
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
            Download & Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
