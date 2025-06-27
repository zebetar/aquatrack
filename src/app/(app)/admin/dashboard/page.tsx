
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Droplets, CreditCard, BarChart3, Loader2, ChevronRight, ArrowUp, ArrowDown, Sparkles, AlertTriangle, TrendingUp, BellRing } from 'lucide-react';
import { useState, useEffect, useCallback, memo, useMemo } from 'react'; 
import Link from 'next/link';
import { 
  getAllMockCustomers,
  getAllMockUsageRecords,
  getMockOutstandingCustomers,
  addMockNotification
} from '@/lib/mock-data-store';
import type { Customer, WaterUsageRecord, CustomerMonthlyUsage, Notification } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isAfter, subHours } from 'date-fns';
import { cn, formatDurationFromHours } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MonthlySupplyDetailsDialog } from '@/components/admin/dashboard/monthly-supply-details-dialog';
import { OutstandingBillsDialog } from '@/components/admin/dashboard/outstanding-bills-dialog';
import { MonthlyRevenueDetailsDialog } from '@/components/admin/dashboard/monthly-revenue-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { summarizeDashboardMetrics, type DashboardMetricsSummary } from '@/ai/flows/summarize-dashboard-flow';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const FuturisticTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const value = data.value;
    const name = data.name; // 'supply' or 'revenue'
    
    let formattedValue;
    if (name === 'supply') {
      formattedValue = formatDurationFromHours(Number(value));
    } else if (name === 'revenue') {
      formattedValue = `PKR ${Number(value).toLocaleString()}`;
    } else {
      formattedValue = value.toLocaleString();
    }

    return (
      <div className="rounded-md border border-primary/20 bg-background/80 py-1.5 px-2.5 shadow-lg backdrop-blur-sm animate-fade-in text-foreground">
        <p className="text-sm font-bold text-primary">{formattedValue}</p>
        <p className="text-xs text-muted-foreground capitalize">{name} for {label}</p>
      </div>
    );
  }
  return null;
};

interface ChartDataPoint {
  label: string;
  supply: number;
  revenue: number;
}

const StatChangeIndicator = memo(({ value }: { value: number }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const Icon = isPositive ? ArrowUp : ArrowDown;

  if (value === 0 || !isFinite(value)) {
    return null;
  }

  return (
    <span className={cn(
      "flex items-center text-xs font-semibold",
      isPositive && "text-green-600 dark:text-green-500",
      isNegative && "text-destructive"
    )}>
      <Icon className="h-3 w-3 mr-1" />
      {Math.abs(value).toFixed(0)}%
    </span>
  );
});
StatChangeIndicator.displayName = 'StatChangeIndicator';


const KeyMetricCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  className, 
  href,
  onClick,
}: { 
  title: string, 
  value: string, 
  icon: React.ElementType, 
  description?: string, 
  className?: string,
  href?: string,
  onClick?: () => void;
}) => {
  const cardInnerContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <div className="p-2 bg-accent/10 dark:bg-accent/20 rounded-full group-hover:bg-accent/20 dark:group-hover:bg-accent/30 transition-colors">
          <Icon className="h-5 w-5 text-primary dark:text-accent" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </>
  );

  const cardClasses = cn(
    "glassmorphism-card interactive-card-hover transition-all duration-300 ease-out",
    className,
    (href || onClick) && "cursor-pointer group" 
  );

  if (href && !onClick) {
    return (
      <Link href={href} className="block h-full group">
        <Card className={cardClasses}>
          {cardInnerContent}
        </Card>
      </Link>
    );
  }
  
  if (onClick) {
    return (
       <div onClick={onClick} className="cursor-pointer h-full group">
        <Card className={cn(cardClasses, "h-full")}>
          {cardInnerContent}
        </Card>
      </div>
    );
  }

  return (
    <Card className={cardClasses}>
      {cardInnerContent}
    </Card>
  );
});
KeyMetricCard.displayName = 'KeyMetricCard'; 


export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Dashboard Metrics
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [monthlySupply, setMonthlySupply] = useState("0 min");
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [outstandingBillsValue, setOutstandingBillsValue] = useState(0);
  const [projectedRevenue, setProjectedRevenue] = useState(0);
  
  // Data for dialogs
  const [isDialogDataLoading, setIsDialogDataLoading] = useState(false);
  const [customersWithMonthlyUsageData, setCustomersWithMonthlyUsageData] = useState<CustomerMonthlyUsage[]>([]);
  const [customersWithOutstandingBills, setCustomersWithOutstandingBills] = useState<Customer[]>([]);
  const [monthlyUsageRecords, setMonthlyUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [topOutstandingCustomers, setTopOutstandingCustomers] = useState<Customer[]>([]);

  // Dialog open states
  const [isMonthlySupplyDialogOpen, setIsMonthlySupplyDialogOpen] = useState(false);
  const [isOutstandingBillsDialogOpen, setIsOutstandingBillsDialogOpen] = useState(false);
  const [isMonthlyRevenueDialogOpen, setIsMonthlyRevenueDialogOpen] = useState(false);

  // Chart state
  const [allUsageRecords, setAllUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [supplyChartView, setSupplyChartView] = useState<'monthly' | 'daily'>('monthly');
  const [revenueChartView, setRevenueChartView] = useState<'monthly' | 'daily'>('monthly');
  const [supplyChartData, setSupplyChartData] = useState<ChartDataPoint[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<ChartDataPoint[]>([]);
  const [supplyChange, setSupplyChange] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);

  // AI Summary state
  const [summary, setSummary] = useState<DashboardMetricsSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const customersWithMonthlyRevenueData = useMemo(() => {
    return customersWithMonthlyUsageData
      .filter(c => c.cost > 0)
      .sort((a, b) => b.cost - a.cost);
  }, [customersWithMonthlyUsageData]);

  const handleGenerateSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);

    const metricsPayload = {
      totalCustomers,
      monthlySupply,
      monthlyRevenue,
      outstandingBillsValue,
      topOutstandingCustomers,
    };

    try {
      const result = await summarizeDashboardMetrics(metricsPayload);
      setSummary(result);
    } catch (e: any) {
      const errorMessage = e.message || "An unknown error occurred while generating the summary.";
      console.error("AI Summary Error:", errorMessage);
      setSummaryError(errorMessage);
      toast({
        variant: "destructive",
        title: "AI Summary Failed",
        description: errorMessage,
      });
    } finally {
      setIsSummaryLoading(false);
    }
  }, [
    toast,
    totalCustomers,
    monthlySupply,
    monthlyRevenue,
    outstandingBillsValue,
    topOutstandingCustomers,
  ]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const firstDay = startOfMonth(today);
      const lastDay = endOfMonth(today);
      const lastMonthDate = subMonths(today, 1);
      const firstDayOfLastMonth = startOfMonth(lastMonthDate);
      const lastDayOfLastMonth = endOfMonth(lastMonthDate);

      const allCustomers = getAllMockCustomers();
      const allUsageRecordsData = getAllMockUsageRecords();
      setAllUsageRecords(allUsageRecordsData);
      
      const usageRecordsThisMonth = allUsageRecordsData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= firstDay && recordDate <= lastDay;
      });
      
      const usageLastMonth = allUsageRecordsData.filter(r => new Date(r.date) >= firstDayOfLastMonth && new Date(r.date) <= lastDayOfLastMonth);

      const outstandingCustomers = allCustomers.filter(c => c.balance > 0);

      setMonthlyUsageRecords(usageRecordsThisMonth);
      setCustomersWithOutstandingBills(outstandingCustomers);
      
      const sortedOutstanding = [...outstandingCustomers].sort((a,b) => b.balance - a.balance);
      setTopOutstandingCustomers(sortedOutstanding.slice(0, 5));

      const currentSupply = usageRecordsThisMonth.reduce((sum, record) => sum + record.durationHours, 0);
      const currentRevenue = usageRecordsThisMonth.reduce((sum, record) => sum + record.cost, 0);
      
      const totalDue = outstandingCustomers.reduce((sum, customer) => sum + customer.balance, 0);
      
      setTotalCustomers(allCustomers.length);
      setMonthlySupply(formatDurationFromHours(currentSupply));
      setMonthlyRevenue(currentRevenue);
      setOutstandingBillsValue(totalDue);

      // Calculate changes for cards
      const lastMonthSupply = usageLastMonth.reduce((sum, r) => sum + r.durationHours, 0);
      const lastMonthRevenue = usageLastMonth.reduce((sum, r) => sum + r.cost, 0);
      setSupplyChange(lastMonthSupply > 0 ? ((currentSupply - lastMonthSupply) / lastMonthSupply) * 100 : (currentSupply > 0 ? 100 : 0));
      setRevenueChange(lastMonthRevenue > 0 ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : (currentRevenue > 0 ? 100 : 0));
      
      // Calculate projected revenue (simple forecast)
      const projection = lastMonthRevenue > 0 ? lastMonthRevenue * 1.05 : currentRevenue > 0 ? currentRevenue * 1.1 : 5000;
      setProjectedRevenue(projection);

    } catch (error) {
      console.error("Failed to load dashboard data", error);
      toast({
        variant: "destructive",
        title: "Error Loading Dashboard",
        description: "Could not retrieve data. Check console for details.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Effect for automated reminders
  useEffect(() => {
    try {
      const isRemindersEnabled = localStorage.getItem('automated_reminders_enabled') === 'true';
      if (isRemindersEnabled) {
        const outstanding = getMockOutstandingCustomers();
        const now = new Date();
        outstanding.forEach(customer => {
          const lastReminderStr = localStorage.getItem(`reminder_last_sent_${customer.id}`);
          const twentyFourHoursAgo = subHours(now, 24);
          if (!lastReminderStr || isAfter(twentyFourHoursAgo, new Date(lastReminderStr))) {
            const reminderNotification: Notification = {
              id: `noti-${Date.now()}-reminder-${customer.id}`,
              userId: customer.authUID || customer.id,
              message: `Reminder: Your bill of PKR ${customer.balance.toLocaleString()} is outstanding.`,
              type: 'BILL_REMINDER',
              isRead: false,
              linkTo: '/viewer/billing',
              createdAt: new Date(),
            };
            addMockNotification(reminderNotification);
            localStorage.setItem(`reminder_last_sent_${customer.id}`, now.toISOString());
          }
        });
      }
    } catch (e) {
      console.error("Error processing automated reminders:", e);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Effect for Chart Data (Combined)
  useEffect(() => {
    if (allUsageRecords.length === 0) return;
    const today = new Date();

    const processData = (view: 'monthly' | 'daily') => {
      if (view === 'monthly') {
        const historicalMap = new Map<string, { supply: number; revenue: number }>();
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(today, i);
            const monthKey = format(date, 'yyyy-MM');
            historicalMap.set(monthKey, { supply: 0, revenue: 0 });
        }
        allUsageRecords.forEach(record => {
            const recordDate = new Date(record.date);
            const monthKey = format(recordDate, 'yyyy-MM');
            if (historicalMap.has(monthKey)) {
                const current = historicalMap.get(monthKey)!;
                current.supply += record.durationHours;
                current.revenue += record.cost;
            }
        });
        return Array.from(historicalMap.entries()).map(([month, data]) => ({
            label: format(parseISO(month + '-01'), 'MMM'), ...data
        }));
      } else { // daily view
        const dailyMap = new Map<string, { supply: number; revenue: number }>();
        const daysToShow = 30;
        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dayKey = format(date, 'yyyy-MM-dd');
            dailyMap.set(dayKey, { supply: 0, revenue: 0 });
        }
        allUsageRecords.forEach(record => {
            const recordDate = new Date(record.date);
            const dayKey = format(recordDate, 'yyyy-MM-dd');
            if (dailyMap.has(dayKey)) {
                const current = dailyMap.get(dayKey)!;
                current.supply += record.durationHours;
                current.revenue += record.cost;
            }
        });
        return Array.from(dailyMap.entries()).map(([day, data]) => ({
            label: format(parseISO(day), 'd'), ...data
        }));
      }
    };
    
    setSupplyChartData(processData(supplyChartView));
    setRevenueChartData(processData(revenueChartView));

  }, [allUsageRecords, supplyChartView, revenueChartView]);


  const loadAndProcessDialogData = useCallback(async () => {
      if (isDialogDataLoading) return;
      setIsDialogDataLoading(true);
      try {
        const customers = getAllMockCustomers();
        
        const customerUsageMap = new Map<string, { name: string, usageHours: number, cost: number }>();
        customers.forEach(c => customerUsageMap.set(c.id, { name: c.name, usageHours: 0, cost: 0 }));

        monthlyUsageRecords.forEach(record => { 
          const entry = customerUsageMap.get(record.customerId);
          if (entry) {
            entry.usageHours += record.durationHours;
            entry.cost += record.cost;
          }
        });
      
        const processedDialogData: CustomerMonthlyUsage[] = Array.from(customerUsageMap.entries())
          .map(([id, data]) => ({ id, ...data }))
          .filter(item => item.usageHours > 0 || item.cost > 0) 
          .sort((a,b) => b.usageHours - a.usageHours);
          
        setCustomersWithMonthlyUsageData(processedDialogData);
      } catch (error) {
        console.error("Failed to load detailed customer data for dialog", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load detailed data for the dialog.",
        });
      } finally {
        setIsDialogDataLoading(false);
      }
  }, [isDialogDataLoading, monthlyUsageRecords, toast]);

  const handleOpenSupplyDialog = async () => {
    setIsMonthlySupplyDialogOpen(true);
    await loadAndProcessDialogData();
  };

  const handleOpenRevenueDialog = async () => {
    setIsMonthlyRevenueDialogOpen(true);
    if (customersWithMonthlyUsageData.length === 0) {
      await loadAndProcessDialogData();
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="glassmorphism-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-2/4" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
          <Card className="glassmorphism-card">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-2/4" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
          </Card>
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="glassmorphism-card h-full">
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-[120px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    { 
      title: 'Total Customers', 
      value: totalCustomers.toString(), 
      icon: Users, 
      description: `${totalCustomers} active`,
      href: '/admin/customers'
    },
    { 
      title: 'Monthly Supply', 
      value: monthlySupply, 
      icon: Droplets, 
      description: 'Current month',
      onClick: handleOpenSupplyDialog
    },
    { 
      title: 'Monthly Revenue', 
      value: `PKR ${monthlyRevenue.toLocaleString('en-US')}`, 
      icon: CreditCard, 
      description: 'Current month',
      onClick: handleOpenRevenueDialog
    },
    { 
      title: 'Outstanding Bills', 
      value: `PKR ${outstandingBillsValue.toLocaleString('en-US')}`, 
      icon: BarChart3, 
      description: 'Total amount due',
      onClick: () => setIsOutstandingBillsDialogOpen(true)
    },
  ];

  const currentMonthLabel = format(new Date(), 'MMMM yyyy');

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6 animate-fade-in">
        {metrics.map(metric => (
          <KeyMetricCard 
            key={metric.title} 
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            description={metric.description}
            href={metric.href}
            onClick={metric.onClick}
          />
        ))}
         <KeyMetricCard 
            title='Projected Revenue'
            value={`PKR ${projectedRevenue.toLocaleString('en-US', {maximumFractionDigits: 0})}`}
            icon={TrendingUp}
            description='Next month forecast'
        />
      </div>
      
      {/* Main Analysis Section in a 2x2 Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
          <Card className="glassmorphism-card interactive-card-hover h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium text-muted-foreground">Supply Volume</CardTitle>
              <Tabs
                  value={supplyChartView}
                  onValueChange={(value) => setSupplyChartView(value as 'monthly' | 'daily')}
                  className="w-auto"
              >
                  <TabsList>
                      <TabsTrigger value="daily" className="text-xs px-3">Daily</TabsTrigger>
                      <TabsTrigger value="monthly" className="text-xs px-3">Monthly</TabsTrigger>
                  </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{monthlySupply}</div>
              <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">For {currentMonthLabel}</p>
                  <StatChangeIndicator value={supplyChange} />
              </div>
              <div className="h-[120px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplyChartData}>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip cursor={{fill: 'hsl(var(--muted) / 0.5)'}} content={<FuturisticTooltip />} />
                      <Bar dataKey="supply" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="animate-fade-in" style={{animationDelay: '0.2s'}}>
          <Card className="glassmorphism-card interactive-card-hover h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium text-muted-foreground">Revenue</CardTitle>
              <Tabs
                  value={revenueChartView}
                  onValueChange={(value) => setRevenueChartView(value as 'monthly' | 'daily')}
                  className="w-auto"
              >
                  <TabsList>
                      <TabsTrigger value="daily" className="text-xs px-3">Daily</TabsTrigger>
                      <TabsTrigger value="monthly" className="text-xs px-3">Monthly</TabsTrigger>
                  </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">PKR {monthlyRevenue.toLocaleString('en-US', {maximumFractionDigits: 0})}</div>
              <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">For {currentMonthLabel}</p>
                  <StatChangeIndicator value={revenueChange} />
              </div>
              <div className="h-[120px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                      <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip cursor={{stroke: 'hsl(var(--primary))', strokeDasharray: '3 3'}} content={<FuturisticTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="animate-fade-in" style={{animationDelay: '0.3s'}}>
          <Card className="ai-summary-card h-full">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Powered Summary
                </CardTitle>
                <Button onClick={handleGenerateSummary} disabled={isSummaryLoading} size="sm">
                    {isSummaryLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate
                </Button>
            </CardHeader>
            {(isSummaryLoading || summaryError || summary) && (
                <CardContent>
                    {isSummaryLoading && (
                        <div className="space-y-4 pt-4 animate-pulse">
                            <p className="text-sm text-muted-foreground">Generating summary...</p>
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-4 bg-muted rounded w-1/2" style={{ animationDelay: '0.1s' }}></div>
                            <div className="h-4 bg-muted rounded w-5/6" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    )}
                    {summaryError && (
                        <div className="border-l-4 border-destructive bg-destructive/10 p-4 rounded-r-md">
                            <h4 className="font-bold text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5"/>Error</h4>
                            <p className="mt-2 text-sm text-destructive-foreground">{summaryError}</p>
                        </div>
                    )}
                    {summary && !isSummaryLoading && !summaryError && (
                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-semibold text-lg">Analysis Complete</h3>
                                <Badge variant={summary.overallStatus === 'positive' ? 'default' : summary.overallStatus === 'negative' ? 'destructive' : 'secondary'} className="capitalize">
                                    {summary.overallStatus}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <h4 className="font-semibold mb-2 text-foreground">Key Takeaways</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                        {summary.keyTakeaways.map((item, index) => (
                                        <li key={`takeaway-${index}`}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 text-foreground">Improvement Suggestions</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                        {summary.improvementSuggestions.map((item, index) => (
                                        <li key={`suggestion-${index}`}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            )}
          </Card>
        </div>
        
        <div className="animate-fade-in" style={{animationDelay: '0.4s'}}>
            <Card className="glassmorphism-card h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top Outstanding Bills</CardTitle>
                 <Button asChild variant="link" size="sm">
                    <Link href="/admin/reports/outstanding-bills">View All</Link>
                 </Button>
              </CardHeader>
              <CardContent>
                {topOutstandingCustomers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No outstanding bills. Great job!</p>
                ) : (
                  <ul className="space-y-1">
                    {topOutstandingCustomers.map((customer) => (
                      <li key={customer.id}>
                        <Link href={`/admin/customers/${customer.id}`} className="flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-muted transition-colors">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person avatar"/>
                              <AvatarFallback>{customer.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold">{customer.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-destructive">PKR {customer.balance.toLocaleString()}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
      
      <MonthlySupplyDetailsDialog
        isOpen={isMonthlySupplyDialogOpen}
        onClose={() => setIsMonthlySupplyDialogOpen(false)}
        data={customersWithMonthlyUsageData.filter(c => c.usageHours > 0)}
        isLoading={isDialogDataLoading}
      />
      <MonthlyRevenueDetailsDialog
        isOpen={isMonthlyRevenueDialogOpen}
        onClose={() => setIsMonthlyRevenueDialogOpen(false)}
        data={customersWithMonthlyRevenueData}
        isLoading={isDialogDataLoading}
      />
      <OutstandingBillsDialog 
        isOpen={isOutstandingBillsDialogOpen}
        onClose={() => setIsOutstandingBillsDialogOpen(false)}
        data={customersWithOutstandingBills}
      />
    </>
  );
}

    
