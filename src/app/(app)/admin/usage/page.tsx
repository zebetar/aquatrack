
"use client";

import { PageHeader } from '@/components/shared/page-header';
import type { WaterUsageRecord } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { getAllMockUsageRecords } from '@/lib/mock-data-store';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UsageList } from '@/components/admin/usage/usage-list';

export default function AdminUsagePage() {
  const [usageRecords, setUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadUsageData = useCallback(() => {
    setIsLoading(true);
    try {
      const records = getAllMockUsageRecords();
      setUsageRecords(records);
    } catch(error) {
       console.error("Failed to fetch usage records from mock store:", error);
        toast({
          variant: "destructive",
          title: "Failed to load usage records",
          description: "Could not retrieve usage data. Check console for details.",
        });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading usage records...</p>
        </div>
    );
  }

  return (
    <div className="mt-6">
      <PageHeader 
        title="All Usage Records"
      />
      <UsageList usageRecords={usageRecords} />
    </div>
  );
}
