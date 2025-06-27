
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Clock, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect, useCallback, memo } from 'react'; 
import { useAuth } from '@/contexts/auth-context';
import { getMockCustomerById, getMockUsageRecordsByCustomerId, getMockPaymentsByCustomerId } from '@/lib/mock-data-store';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { format } from 'date-fns';
import { cn, formatDurationFromHours } from '@/lib/utils';

const SummaryCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  actionLink, 
  actionLabel, 
  className 
}: { 
  title: string, 
  value: string, 
  icon: React.ElementType, 
  actionLink?: string, 
  actionLabel?: string, 
  className?: string 
}) => (
  <Card className={cn("shadow-md glassmorphism-card", className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {actionLink && actionLabel && (
        <Button variant="link" asChild className="px-0 pt-2 text-primary">
          <Link href={actionLink}>{actionLabel}</Link>
        </Button>
      )}
    </CardContent>
  </Card>
));
SummaryCard.displayName = 'SummaryCard'; 


export default function ViewerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [customerProfile, setCustomerProfile] = useState<Customer | null>(null);
  const [recentUsageHours, setRecentUsageHours] = useState(0);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const viewerUserId = user?.id; 

  const loadDashboardData = useCallback(async () => {
    if (!viewerUserId) { 
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const profile = user?.customerId ? getMockCustomerById(user.customerId) : null;
    setCustomerProfile(profile);

    const usageRecords = getMockUsageRecordsByCustomerId(user?.customerId || viewerUserId); 
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const recentUsage = usageRecords
      .filter(record => new Date(record.date) >= sevenDaysAgo)
      .reduce((sum, record) => sum + record.durationHours, 0);
    setRecentUsageHours(recentUsage);

    const payments = getMockPaymentsByCustomerId(user?.customerId || viewerUserId); 
    if (payments.length > 0) {
      payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      setLastPayment(payments[0]);
    } else {
      setLastPayment(null);
    }

    setIsLoading(false);
  }, [viewerUserId, user?.customerId]); 

  useEffect(() => {
    if (!authLoading && viewerUserId) {
      loadDashboardData();
      const intervalId = setInterval(loadDashboardData, 30000); // Refresh data every 30s
      return () => clearInterval(intervalId);
    } else if (!authLoading && !viewerUserId) {
        setIsLoading(false);
    }
  }, [authLoading, viewerUserId, loadDashboardData]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Droplets className="h-8 w-8 animate-pulse-subtle text-primary" />
        <p className="ml-2">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) { 
      return <p>Not authenticated. Please log in.</p>
  }
   if (!viewerUserId) { 
      return <p>Could not load dashboard data: User ID not found.</p>
  }


  const summaries = [
    { title: 'Current Outstanding Bill', value: `PKR ${customerProfile?.balance?.toLocaleString('en-US') ?? '0.00'}`, icon: FileText, actionLink: '/viewer/billing', actionLabel: 'View Details' },
    { title: 'Recent Usage (Last 7 Days)', value: formatDurationFromHours(recentUsageHours), icon: Clock, actionLink: '/viewer/usage', actionLabel: 'View History' },
    { title: 'Last Payment Made', value: lastPayment ? `PKR ${lastPayment.amountPaid.toLocaleString('en-US')}` : 'N/A', icon: DollarSign, actionLink: '/viewer/billing', actionLabel: 'View Payments' },
  ];

  return (
    <div className="mt-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-6">
        Welcome, {customerProfile?.name ?? 'Customer'}!
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaries.map(summary => (
          <SummaryCard key={summary.title} {...summary} />
        ))}
      </div>
    </div>
  );
}
