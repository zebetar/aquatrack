
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Clock, Loader2, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getMockCustomerById, getMockUsageRecordsByCustomerId, getMockPaymentsByCustomerId, getMockNotificationsByUserId } from '@/lib/mock-data-store';
import type { Customer, WaterUsageRecord, Payment, Notification as AppNotification } from '@/types';
import { format } from 'date-fns';
import { cn, formatDurationFromHours } from '@/lib/utils';

const SummaryCard = ({ title, value, icon: Icon, actionLink, actionLabel, className }: { title: string, value: string, icon: React.ElementType, actionLink?: string, actionLabel?: string, className?: string }) => (
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
);

export default function ViewerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [customerProfile, setCustomerProfile] = useState<Customer | null>(null);
  const [recentUsageHours, setRecentUsageHours] = useState(0);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[]>([]);

  // Correctly use user.id which is the authUID for viewers
  const viewerUserId = user?.id; 

  const loadDashboardData = useCallback(async () => {
    if (!viewerUserId) { // If no viewerUserId, no data to load for a specific user
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100)); 

    // For viewers, user.id is their authUID, which should be used to get customer data IF
    // the customer ID (cust-xxxx) is stored on the user object as user.customerId.
    // getMockCustomerById expects the 'cust-xxxx' ID.
    const profile = user?.customerId ? getMockCustomerById(user.customerId) : null;
    setCustomerProfile(profile);

    const usageRecords = getMockUsageRecordsByCustomerId(user?.customerId || viewerUserId); // Prefer customerId if available
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const recentUsage = usageRecords
      .filter(record => new Date(record.date) >= sevenDaysAgo)
      .reduce((sum, record) => sum + record.durationHours, 0);
    setRecentUsageHours(recentUsage);

    const payments = getMockPaymentsByCustomerId(user?.customerId || viewerUserId); // Prefer customerId
    if (payments.length > 0) {
      payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      setLastPayment(payments[0]);
    } else {
      setLastPayment(null);
    }

    // Notifications are keyed to user.id (authUID)
    const notifications = getMockNotificationsByUserId(viewerUserId);
    setRecentNotifications(notifications.slice(0, 3)); 

    setIsLoading(false);
  }, [viewerUserId, user?.customerId]); // Added user.customerId to dependencies

  useEffect(() => {
    if (!authLoading && viewerUserId) {
      loadDashboardData();
      const intervalId = setInterval(loadDashboardData, 30000);
      return () => clearInterval(intervalId);
    } else if (!authLoading && !viewerUserId) {
        setIsLoading(false);
    }
  }, [authLoading, viewerUserId, loadDashboardData]);

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
   if (!viewerUserId) { // Should be caught by !user check
      return <p>Could not load dashboard data: User ID not found.</p>
  }


  const summaries = [
    { title: 'Current Outstanding Bill', value: `PKR ${customerProfile?.balance?.toLocaleString('en-US') ?? '0.00'}`, icon: FileText, actionLink: '/viewer/billing', actionLabel: 'View Details' },
    { title: 'Recent Usage (Last 7 Days)', value: formatDurationFromHours(recentUsageHours), icon: Clock, actionLink: '/viewer/usage', actionLabel: 'View History' },
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
        <Card className="shadow-md glassmorphism-card">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <p className="text-muted-foreground">No recent notifications.</p> 
            ) : (
               <ul className="space-y-3">
                {recentNotifications.map(activity => (
                  <li key={activity.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/30">
                    <BellRing className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{format(activity.createdAt, 'PP p')}</p>
                       {activity.linkTo && (
                         <Button variant="link" size="xs" asChild className="px-0 h-auto text-primary">
                           <Link href={activity.linkTo}>View</Link>
                         </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" asChild className="mt-4">
              <Link href="/viewer/notifications">View All Notifications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
