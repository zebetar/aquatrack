"use client";

import { PageHeader } from '@/components/shared/page-header';
import type { WaterUsageRecord } from '@/types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Droplets, Search } from 'lucide-react';
import { UsageList } from '@/components/admin/usage/usage-list';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { getAllMockUsageRecords } from '@/lib/mock-data-store';

export default function AdminUsagePage() {
  const [usageRecords, setUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadUsageData = useCallback(() => {
    setIsLoading(true);
    const records = getAllMockUsageRecords();
    setUsageRecords(records);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  const filteredUsageRecords = useMemo(() => {
    if (!searchTerm) return usageRecords;
    return usageRecords.filter(r => r.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [usageRecords, searchTerm]);

  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Droplets className="h-8 w-8 animate-pulse-subtle text-primary" />
            <p className="ml-2">Loading usage records...</p>
        </div>
    );
  }

  const searchInput = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input 
        placeholder="Search by customer name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  );

  const pageActions = (
    <div className="flex items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search Usage Records</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Search Usage Records</DialogTitle>
          </DialogHeader>
          {searchInput}
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="mt-6">
      <PageHeader 
        title="All Usage Records"
        actions={pageActions}
      />
      <UsageList usageRecords={filteredUsageRecords} />
    </div>
  );
}
