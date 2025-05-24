
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getMockCustomerById, getMockUsageRecordsByCustomerId, getMockPaymentsByCustomerId } from '@/lib/mock-data-store';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { differenceInDays, parseISO } from 'date-fns';


const SummaryCard = ({ title, value, icon: Icon, actionLink, actionLabel }: { title: string, value: string, icon: React.ElementType, actionLink?: string, actionLabel?: string }) => (
  <Card className="shadow-md">
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
);

export default function ViewerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [customerProfile, setCustomerProfile] = useState<Customer | null>(null);
  const [recentUsageHours, setRecentUsageHours] = useState(0);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!user || !user.customerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate async fetch

    const profile = getMockCustomerById(user.customerId);
    setCustomerProfile(profile);

    const usageRecords = getMockUsageRecordsByCustomerId(user.customerId);
    const today = new Date();
    const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));
    const recentUsage = usageRecords
      .filter(record => new Date(record.date) >= sevenDaysAgo)
      .reduce((sum, record) => sum + record.durationHours, 0);
    setRecentUsageHours(recentUsage);

    const payments = getMockPaymentsByCustomerId(user.customerId);
    if (payments.length > 0) {
      // Sort payments by date to find the most recent
      payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      setLastPayment(payments[0]);
    } else {
      setLastPayment(null);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadDashboardData();
    }
  }, [authLoading, loadDashboardData]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
      return <p>Not authenticated. Please log in.</p>
  }

  const summaries = [
    { title: 'Current Outstanding Bill', value: `PKR ${customerProfile?.balance?.toLocaleString('en-US') ?? '0'}`, icon: FileText, actionLink: '/viewer/billing', actionLabel: 'View Details' },
    { title: 'Recent Usage (Last 7 Days)', value: `${recentUsageHours.toFixed(1)} hrs`, icon: Clock, actionLink: '/viewer/usage', actionLabel: 'View History' },
    { title: 'Last Payment Made', value: lastPayment ? `PKR ${lastPayment.amountPaid.toLocaleString('en-US')}` : 'N/A', icon: DollarSign, actionLink: '/viewer/billing', actionLabel: 'View Payments' },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${customerProfile?.name ?? 'Customer'}!`} description="Your water usage and billing summary." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaries.map(summary => (
          <SummaryCard key={summary.title} {...summary} />
        ))}
      </div>
      <div className="mt-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Notification fetching logic would go here if implemented */}
            <p className="text-muted-foreground">No recent notifications.</p> 
            <Button variant="default" asChild className="mt-4">
              <Link href="/viewer/notifications">View All Notifications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
