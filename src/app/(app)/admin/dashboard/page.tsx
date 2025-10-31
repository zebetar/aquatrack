
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Droplets, CreditCard, BarChart3, ChevronRight, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { useState, useEffect, useCallback, memo, useMemo } from 'react'; 
import Link from 'next/link';
import type { Customer, WaterUsageRecord, CustomerMonthlyUsage, ChartConfig } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { cn, formatDurationFromHours } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MonthlySupplyDetailsDialog } from '@/components/admin/dashboard/monthly-supply-details-dialog';
import { OutstandingBillsDialog } from '@/components/admin/dashboard/outstanding-bills-dialog';
import { MonthlyRevenueDetailsDialog } from '@/components/admin/dashboard/monthly-revenue-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllCustomers, getAllUsageRecords, getOutstandingCustomers } from '@/lib/firebase-service';

const chartConfig = {
  supply: {
    label: "Supply",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

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
  value: React.ReactNode, 
  icon: React.ElementType, 
  description?: React.ReactNode, 
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
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard Metrics
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [monthlySupply, setMonthlySupply] = useState("0 min");
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [outstandingBillsValue, setOutstandingBillsValue] = useState(0);
  
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

  const customersWithMonthlyRevenueData = useMemo(() => {
    return customersWithMonthlyUsageData
      .filter(c => c.cost > 0)
      .sort((a, b) => b.cost - a.cost);
  }, [customersWithMonthlyUsageData]);


  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
        const today = new Date();
        const firstDay = startOfMonth(today);
        const lastDay = endOfMonth(today);
        const lastMonthDate = subMonths(today, 1);
        const firstDayOfLastMonth = startOfMonth(lastMonthDate);
        const lastDayOfLastMonth = endOfMonth(lastMonthDate);

        const [allCustomers, allUsageRecordsData, outstandingCustomers] = await Promise.all([
            getAllCustomers(),
            getAllUsageRecords(),
            getOutstandingCustomers()
        ]);
        
        setAllUsageRecords(allUsageRecordsData);
        
        const usageRecordsThisMonth = allUsageRecordsData.filter(record => record.date >= firstDay && record.date <= lastDay);
        const usageLastMonth = allUsageRecordsData.filter(r => r.date >= firstDayOfLastMonth && r.date <= lastDayOfLastMonth);

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

        const lastMonthRevenueCalc = usageLastMonth.reduce((sum, r) => sum + r.cost, 0);
        const lastMonthSupply = usageLastMonth.reduce((sum, r) => sum + r.durationHours, 0);
        setSupplyChange(lastMonthSupply > 0 ? ((currentSupply - lastMonthSupply) / lastMonthSupply) * 100 : (currentSupply > 0 ? 100 : 0));
        setRevenueChange(lastMonthRevenueCalc > 0 ? ((currentRevenue - lastMonthRevenueCalc) / lastMonthRevenueCalc) * 100 : (currentRevenue > 0 ? 100 : 0));
    } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load dashboard data.' });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
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
            const recordDate = record.date;
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
            const recordDate = record.date;
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
    setIsDialogDataLoading(true);
    try {
        const customers = await getAllCustomers();
          
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
        console.error("Failed to load dialog data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load customer details for the dialog.' });
    } finally {
        setIsDialogDataLoading(false);
    }
  }, [monthlyUsageRecords, toast]);

  const handleOpenSupplyDialog = () => {
    setIsMonthlySupplyDialogOpen(true);
    loadAndProcessDialogData();
  };

  const handleOpenRevenueDialog = () => {
    setIsMonthlyRevenueDialogOpen(true);
    if (customersWithMonthlyUsageData.length === 0) {
      loadAndProcessDialogData();
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
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
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
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <BarChart accessibilityLayer data={supplyChartData}>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <ChartTooltip cursor={false} content={<FuturisticTooltip />} />
                      <Bar dataKey="supply" fill="var(--color-supply)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
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
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <AreaChart accessibilityLayer data={revenueChartData}>
                      <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <ChartTooltip cursor={false} content={<FuturisticTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
              </div>
            </CardContent>
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

    
