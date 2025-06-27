
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Clock, Droplets, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect, useCallback, memo } from 'react'; 
import { useAuth } from '@/contexts/auth-context';
import { getMockCustomerById, getMockUsageRecordsByCustomerId, getMockPaymentsByCustomerId } from '@/lib/mock-data-store';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { format } from 'date-fns';
import { cn, formatDurationFromHours } from '@/lib/utils';

const TrendIndicator = memo(({ value }: { value: number | null }) => {
    if (value === null || !isFinite(value)) {
        return <span className="text-xs text-muted-foreground">vs. historical average</span>;
    }

    // For water usage, higher is "worse" (more expensive), so we use red for up and green for down.
    const isPositive = value > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? "text-destructive" : "text-green-600 dark:text-green-500";
    
    if (Math.abs(value) < 1) {
         return <span className="text-xs text-muted-foreground">About the same as average</span>;
    }

    return (
        <div className={`flex items-center text-base font-semibold ${colorClass}`}>
            <Icon className="h-5 w-5 mr-1" />
            <span>
                {Math.abs(value).toFixed(0)}% {isPositive ? 'more' : 'less'}
            </span>
        </div>
    );
});
TrendIndicator.displayName = "TrendIndicator";


const SummaryCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  actionLink, 
  actionLabel, 
  description,
  className 
}: { 
  title: string, 
  value: React.ReactNode, 
  icon: React.ElementType, 
  actionLink?: string, 
  actionLabel?: string, 
  description?: React.ReactNode,
  className?: string 
}) => (
  <Card className={cn("shadow-md glassmorphism-card", className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
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
  const [usageComparison, setUsageComparison] = useState<number | null>(null);

  const viewerUserId = user?.id; 

  const loadDashboardData = useCallback(async () => {
    if (!viewerUserId || !user?.customerId) { 
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const profile = getMockCustomerById(user.customerId);
    setCustomerProfile(profile);

    const usageRecords = getMockUsageRecordsByCustomerId(user.customerId);
    
    // Recent Usage (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const recentUsage = usageRecords
      .filter(record => new Date(record.date) >= sevenDaysAgo)
      .reduce((sum, record) => sum + record.durationHours, 0);
    setRecentUsageHours(recentUsage);

    // Last Payment
    const payments = getMockPaymentsByCustomerId(user.customerId);
    if (payments.length > 0) {
      payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      setLastPayment(payments[0]);
    } else {
      setLastPayment(null);
    }
    
    // Calculate Usage Comparison
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const currentMonthUsage = usageRecords
      .filter(r => new Date(r.date) >= startOfCurrentMonth)
      .reduce((sum, r) => sum + r.durationHours, 0);

    const historicalRecords = usageRecords.filter(r => new Date(r.date) < startOfCurrentMonth);
    
    const monthlyTotals: { [key: string]: number } = {};
    historicalRecords.forEach(r => {
        const monthKey = format(new Date(r.date), 'yyyy-MM');
        if (!monthlyTotals[monthKey]) {
            monthlyTotals[monthKey] = 0;
        }
        monthlyTotals[monthKey] += r.durationHours;
    });

    const monthlyValues = Object.values(monthlyTotals);
    if (monthlyValues.length > 0) {
        const historicalAverage = monthlyValues.reduce((sum, v) => sum + v, 0) / monthlyValues.length;
        if (historicalAverage > 0) {
            const percentageDiff = ((currentMonthUsage - historicalAverage) / historicalAverage) * 100;
            setUsageComparison(percentageDiff);
        } else {
             setUsageComparison(currentMonthUsage > 0 ? 100 : 0);
        }
    } else {
        setUsageComparison(null);
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
    { title: 'Usage Trend', value: <TrendIndicator value={usageComparison} />, icon: BarChart3, description: 'Compared to your historical average.'},
  ];

  return (
    <div className="mt-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-6">
        Welcome, {customerProfile?.name ?? 'Customer'}!
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {summaries.map(summary => (
          <SummaryCard key={summary.title} {...summary} />
        ))}
      </div>
    </div>
  );
}
