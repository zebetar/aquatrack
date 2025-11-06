
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Clock, Droplets, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect, useCallback, memo } from 'react'; 
import { useAuth } from '@/contexts/auth-context';
import type { Customer, WaterUsageRecord, ChartConfig } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { cn, formatDurationFromHours } from '@/lib/utils';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCustomerByAuthUID, getUsageRecordsByCustomerId } from '@/lib/firebase-service';
import { useToast } from '@/hooks/use-toast';

const chartConfig = {
  usage: {
    label: "Usage",
    color: "hsl(var(--chart-1))",
  },
  cost: {
    label: "Cost",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const FuturisticTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const value = data.value;
    const name = data.name; // 'usage' or 'cost'
    
    let formattedValue;
    if (name === 'usage') {
      formattedValue = formatDurationFromHours(Number(value));
    } else if (name === 'cost') {
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
      isPositive && "text-destructive",
      isNegative && "text-green-600 dark:text-green-500"
    )}>
      <Icon className="h-3 w-3 mr-1" />
      {Math.abs(value).toFixed(0)}%
    </span>
  );
});
StatChangeIndicator.displayName = 'StatChangeIndicator';


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


interface ChartDataPoint {
  label: string;
  usage: number;
  cost: number;
}


export default function ViewerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [customerProfile, setCustomerProfile] = useState<Customer | null>(null);
  
  const [currentMonthUsage, setCurrentMonthUsage] = useState(0);
  const [currentMonthCost, setCurrentMonthCost] = useState(0);
  const [usageChange, setUsageChange] = useState(0);
  const [costChange, setCostChange] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);

  const [allUsageRecords, setAllUsageRecords] = useState<WaterUsageRecord[]>([]);
  const [usageChartView, setUsageChartView] = useState<'monthly' | 'daily'>('monthly');
  const [costChartView, setCostChartView] = useState<'monthly' | 'daily'>('monthly');
  const [usageChartData, setUsageChartData] = useState<ChartDataPoint[]>([]);
  const [costChartData, setCostChartData] = useState<ChartDataPoint[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    try {
        const customer = await getCustomerByAuthUID(user.id);
        if (!customer) {
          toast({ variant: 'destructive', title: 'Profile not found', description: 'Could not find a customer profile linked to your account.' });
          setIsLoading(false);
          return;
        }

        setCustomerProfile(customer);
        const usageRecords = await getUsageRecordsByCustomerId(customer.id);
        setAllUsageRecords(usageRecords);
        
        const today = new Date();
        const firstDay = startOfMonth(today);
        const lastDay = endOfMonth(today);
        const lastMonthDate = subMonths(today, 1);
        const firstDayOfLastMonth = startOfMonth(lastMonthDate);
        const lastDayOfLastMonth = endOfMonth(lastMonthDate);

        const usageThisMonthRecords = usageRecords.filter(record => new Date(record.date) >= firstDay && new Date(record.date) <= lastDay);
        const usageLastMonthRecords = usageRecords.filter(r => new Date(r.date) >= firstDayOfLastMonth && new Date(r.date) <= lastDayOfLastMonth);

        const thisMonthTotalUsage = usageThisMonthRecords.reduce((sum, record) => sum + record.durationHours, 0);
        const thisMonthTotalCost = usageThisMonthRecords.reduce((sum, record) => sum + record.cost, 0);
        const lastMonthTotalUsage = usageLastMonthRecords.reduce((sum, record) => sum + record.durationHours, 0);
        const lastMonthTotalCost = usageLastMonthRecords.reduce((sum, record) => sum + record.cost, 0);
        
        setCurrentMonthUsage(thisMonthTotalUsage);
        setCurrentMonthCost(thisMonthTotalCost);
        
        setUsageChange(lastMonthTotalUsage > 0 ? ((thisMonthTotalUsage - lastMonthTotalUsage) / lastMonthTotalUsage) * 100 : (thisMonthTotalUsage > 0 ? 100 : 0));
        setCostChange(lastMonthTotalCost > 0 ? ((thisMonthTotalCost - lastMonthTotalCost) / lastMonthTotalCost) * 100 : (thisMonthTotalCost > 0 ? 100 : 0));
    } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load dashboard data.' });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]); 

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboardData();
    } else if (!authLoading && !user) {
        setIsLoading(false);
    }
  }, [authLoading, user, loadDashboardData]);

  useEffect(() => {
    if (allUsageRecords.length === 0) return;
    const today = new Date();

    const processData = (view: 'monthly' | 'daily') => {
      if (view === 'monthly') {
        const historicalMap = new Map<string, { usage: number; cost: number }>();
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(today, i);
            const monthKey = format(date, 'yyyy-MM');
            historicalMap.set(monthKey, { usage: 0, cost: 0 });
        }
        allUsageRecords.forEach(record => {
            const recordDate = new Date(record.date);
            const monthKey = format(recordDate, 'yyyy-MM');
            if (historicalMap.has(monthKey)) {
                const current = historicalMap.get(monthKey)!;
                current.usage += record.durationHours;
                current.cost += record.cost;
            }
        });
        return Array.from(historicalMap.entries()).map(([month, data]) => ({
            label: format(parseISO(month + '-01'), 'MMM'), ...data
        }));
      } else { // daily view
        const dailyMap = new Map<string, { usage: number; cost: number }>();
        const daysToShow = 30;
        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dayKey = format(date, 'yyyy-MM-dd');
            dailyMap.set(dayKey, { usage: 0, cost: 0 });
        }
        allUsageRecords.forEach(record => {
            const recordDate = new Date(record.date);
            const dayKey = format(recordDate, 'yyyy-MM-dd');
            if (dailyMap.has(dayKey)) {
                const current = dailyMap.get(dayKey)!;
                current.usage += record.durationHours;
                current.cost += record.cost;
            }
        });
        return Array.from(dailyMap.entries()).map(([day, data]) => ({
            label: format(parseISO(day), 'd'), ...data
        }));
      }
    };
    
    setUsageChartData(processData(usageChartView));
    setCostChartData(processData(costChartView));

  }, [allUsageRecords, usageChartView, costChartView]);


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
  
  const currentMonthLabel = format(new Date(), 'MMMM yyyy');

  return (
    <div className="mt-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Welcome, {customerProfile?.name ?? user.name ?? 'Customer'}!
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
            title='Outstanding Bill' 
            value={`PKR ${customerProfile?.balance?.toLocaleString('en-US') ?? '0'}`}
            icon={FileText} 
            actionLink='/viewer/billing' 
            actionLabel='View Details' />
        <SummaryCard 
            title='Current Month Usage' 
            value={formatDurationFromHours(currentMonthUsage)} 
            icon={Clock} 
            actionLink='/viewer/usage' 
            actionLabel='View History' 
            description={<StatChangeIndicator value={usageChange} />}
        />
        <SummaryCard 
            title='Current Month Cost' 
            value={`PKR ${currentMonthCost.toLocaleString()}`} 
            icon={DollarSign} 
            actionLink='/viewer/usage' 
            actionLabel='View History' 
            description={<StatChangeIndicator value={costChange} />}
        />
        <SummaryCard 
            title='Total Usage (All Time)' 
            value={formatDurationFromHours(allUsageRecords.reduce((sum, r) => sum + r.durationHours, 0))} 
            icon={BarChart3} 
            description='Since account creation'
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <Card className="glassmorphism-card interactive-card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium text-muted-foreground">Usage Volume</CardTitle>
              <Tabs
                  value={usageChartView}
                  onValueChange={(value) => setUsageChartView(value as 'monthly' | 'daily')}
                  className="w-auto"
              >
                  <TabsList>
                      <TabsTrigger value="daily" className="text-xs px-3">Daily</TabsTrigger>
                      <TabsTrigger value="monthly" className="text-xs px-3">Monthly</TabsTrigger>
                  </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatDurationFromHours(currentMonthUsage)}</div>
              <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">For {currentMonthLabel}</p>
                  <StatChangeIndicator value={usageChange} />
              </div>
              <div className="h-[120px] mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <BarChart accessibilityLayer data={usageChartData}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip cursor={false} content={<FuturisticTooltip />} />
                    <Bar dataKey="usage" radius={[4, 4, 0, 0]} fill="var(--color-usage)" />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
        </Card>

        <Card className="glassmorphism-card interactive-card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium text-muted-foreground">Usage Cost</CardTitle>
              <Tabs
                  value={costChartView}
                  onValueChange={(value) => setCostChartView(value as 'monthly' | 'daily')}
                  className="w-auto"
              >
                  <TabsList>
                      <TabsTrigger value="daily" className="text-xs px-3">Daily</TabsTrigger>
                      <TabsTrigger value="monthly" className="text-xs px-3">Monthly</TabsTrigger>
                  </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">PKR {currentMonthCost.toLocaleString('en-US', {maximumFractionDigits: 0})}</div>
              <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">For {currentMonthLabel}</p>
                  <StatChangeIndicator value={costChange} />
              </div>
              <div className="h-[120px] mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                  <AreaChart accessibilityLayer data={costChartData}>
                    <defs>
                        <linearGradient id="colorCostViewer" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip cursor={false} content={<FuturisticTooltip />} />
                    <Area type="monotone" dataKey="cost" stroke="hsl(var(--chart-1))" fill="url(#colorCostViewer)" />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

    

    