
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
import { EditUsageRecordForm } from "./edit-usage-record-form";
import type { WaterUsageRecord } from "@/types";
import { useState } from "react";

interface EditUsageRecordDialogProps {
  usageRecord: WaterUsageRecord;
  onUsageRecordUpdated: (updatedRecord: WaterUsageRecord) => void;
  triggerButton?: React.ReactNode;
}

export function EditUsageRecordDialog({ usageRecord, onUsageRecordUpdated, triggerButton }: EditUsageRecordDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (updatedRecord: WaterUsageRecord) => {
    onUsageRecordUpdated(updatedRecord);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="ghost" size="icon" title="Edit Usage Record">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Water Usage for {usageRecord.customerName}</DialogTitle>
        </DialogHeader>
        <EditUsageRecordForm existingRecord={usageRecord} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
