
"use client"; 

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, getDaysInMonth, addMonths } from 'date-fns';
import type { Customer, WaterUsageRecord, ChartConfig, ProjectedRevenueOutput } from '@/types';
import { formatDurationFromHours, cn } from '@/lib/utils';
import { Droplets, ArrowUp, ArrowDown, ChevronRight, TrendingUp, BadgeAlert, Bot } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllCustomers, getAllUsageRecords } from '@/lib/firebase-service';
import { useToast } from '@/hooks/use-toast';
import { projectRevenueFlow } from '@/app/(app)/admin/settings/actions';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  supply: {
    label: "Supply",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
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

interface CustomerConsumption {
  id: string;
  name: string;
  consumption: number;
}

const StatChangeIndicator = ({ value }: { value: number }) => {
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
};

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  const [allUsageRecords, setAllUsageRecords] = useState<WaterUsageRecord[]>([]);

  // Chart State
  const [supplyChartView, setSupplyChartView] = useState<'monthly' | 'daily'>('monthly');
  const [revenueChartView, setRevenueChartView] = useState<'monthly' | 'daily'>('monthly');
  const [supplyChartData, setSupplyChartData] = useState<ChartDataPoint[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<ChartDataPoint[]>([]);

  // Monthly Stats
  const [supplyThisMonth, setSupplyThisMonth] = useState(0);
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [supplyChange, setSupplyChange] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  
  const [topCustomers, setTopCustomers] = useState<CustomerConsumption[]>([]);
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [averageConsumption, setAverageConsumption] = useState(0);
  
  // AI Projection State
  const [isProjecting, setIsProjecting] = useState(false);
  const [projection, setProjection] = useState<ProjectedRevenueOutput | null>(null);

  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy')
      });
    }
    return options;
  }, []);

  const handleProjection = useCallback(async () => {
    setIsProjecting(true);
    setProjection(null);
    try {
        const selectedDate = parseISO(selectedMonth);
        const lastMonthDate = subMonths(selectedDate, 1);
        const firstDayOfLastMonth = startOfMonth(lastMonthDate);
        const lastDayOfLastMonth = endOfMonth(lastMonthDate);
        
        const usageLastMonth = allUsageRecords.filter(r => new Date(r.date) >= firstDayOfLastMonth && new Date(r.date) <= lastDayOfLastMonth);
        const lastMonthRevenue = usageLastMonth.reduce((sum, r) => sum + r.cost, 0);

        const input = {
            lastMonthRevenue: lastMonthRevenue,
            currentMonthRevenue: revenueThisMonth,
            currentDate: selectedDate.toISOString(),
        };

        const result = await projectRevenueFlow(input);
        setProjection(result);
    } catch(error) {
        console.error("Error generating revenue projection:", error);
        toast({ variant: 'destructive', title: 'Projection Failed', description: 'Could not generate AI revenue projection.'});
    } finally {
        setIsProjecting(false);
    }
  }, [selectedMonth, allUsageRecords, revenueThisMonth, toast]);

  const loadReportsData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [records, customers] = await Promise.all([
            getAllUsageRecords(),
            getAllCustomers()
        ]);

        setAllUsageRecords(records);
        
        const selectedDate = parseISO(selectedMonth);

        const firstDayOfMonth = startOfMonth(selectedDate);
        const lastDayOfMonth = endOfMonth(selectedDate);
        const lastMonthDate = subMonths(selectedDate, 1);
        const firstDayOfLastMonth = startOfMonth(lastMonthDate);
        const lastDayOfLastMonth = endOfMonth(lastMonthDate);

        const usageThisMonth = records.filter(r => new Date(r.date) >= firstDayOfMonth && new Date(r.date) <= lastDayOfMonth);
        const usageLastMonth = records.filter(r => new Date(r.date) >= firstDayOfLastMonth && new Date(r.date) <= lastDayOfLastMonth);
        
        const currentMonthSupply = usageThisMonth.reduce((sum, r) => sum + r.durationHours, 0);
        const currentMonthRevenue = usageThisMonth.reduce((sum, r) => sum + r.cost, 0);
        const lastMonthSupply = usageLastMonth.reduce((sum, r) => sum + r.durationHours, 0);
        const lastMonthRevenue = usageLastMonth.reduce((sum, r) => sum + r.cost, 0);

        setSupplyThisMonth(currentMonthSupply);
        setRevenueThisMonth(currentMonthRevenue);
        setSupplyChange(lastMonthSupply > 0 ? ((currentMonthSupply - lastMonthSupply) / lastMonthSupply) * 100 : (currentMonthSupply > 0 ? 100 : 0));
        setRevenueChange(lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : (currentMonthRevenue > 0 ? 100 : 0));
        
        const customerConsumptionMap = new Map<string, { id: string, name: string, consumption: number }>();
        usageThisMonth.forEach(record => {
            const current = customerConsumptionMap.get(record.customerId) || { id: record.customerId, name: record.customerName, consumption: 0 };
            current.consumption += record.durationHours;
            customerConsumptionMap.set(record.customerId, current);
        });

        const processedTopCustomers = Array.from(customerConsumptionMap.values())
            .sort((a,b) => b.consumption - a.consumption)
            .slice(0, 5);
        setTopCustomers(processedTopCustomers);

        setTotalRevenue(currentMonthRevenue);
        const totalOutstanding = customers.reduce((sum, customer) => sum + customer.balance, 0);
        setOutstandingBalance(totalOutstanding);
        const activeCustomersThisMonth = customerConsumptionMap.size;
        setAverageConsumption(activeCustomersThisMonth > 0 ? currentMonthSupply / activeCustomersThisMonth : 0);
    } catch (error: any) {
        console.error("Failed to load reports data:", error);
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not load reports data.' });
    } finally {
        setIsLoading(false);
    }
  }, [selectedMonth, toast]);

  useEffect(() => {
    loadReportsData();
    setProjection(null); // Reset projection when month changes
  }, [loadReportsData]);

  // Combined Effect for Chart Data
  useEffect(() => {
      if (allUsageRecords.length === 0) return;
      const selectedDate = parseISO(selectedMonth);

      const createMonthlyData = () => {
          const historicalMap = new Map<string, { supply: number; revenue: number }>();
          for (let i = 5; i >= 0; i--) {
              const date = subMonths(new Date(), i);
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
      };

      const createDailyData = () => {
          const dailyMap = new Map<string, { supply: number; revenue: number }>();
          const firstDay = startOfMonth(selectedDate);
          const lastDay = endOfMonth(selectedDate);
          
          for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
              const dayKey = format(d, 'yyyy-MM-dd');
              dailyMap.set(dayKey, { supply: 0, revenue: 0 });
          }

          const usageInMonth = allUsageRecords.filter(r => {
            const rDate = new Date(r.date);
            return rDate >= firstDay && rDate <= lastDay;
          });

          usageInMonth.forEach(record => {
              const dayKey = format(new Date(record.date), 'yyyy-MM-dd');
              if (dailyMap.has(dayKey)) {
                  const current = dailyMap.get(dayKey)!;
                  current.supply += record.durationHours;
                  current.revenue += record.cost;
              }
          });
          return Array.from(dailyMap.entries()).map(([day, data]) => ({
              label: format(parseISO(day), 'd'), ...data
          }));
      };

      if (supplyChartView === 'monthly') {
          setSupplyChartData(createMonthlyData());
      } else {
          setSupplyChartData(createDailyData());
      }

      if (revenueChartView === 'monthly') {
          setRevenueChartData(createMonthlyData());
      } else {
          setRevenueChartData(createDailyData());
      }
  }, [allUsageRecords, supplyChartView, revenueChartView, selectedMonth]);


  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || "Selected Month";

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center mt-6">
        <Droplets className="h-8 w-8 animate-pulse-subtle text-primary" />
        <p className="ml-2">Generating reports...</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Water Supply Overview</h1>
         <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
                {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      <h2 className="text-xl font-semibold">Monthly Performance</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glassmorphism-card">
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
            <div className="text-3xl font-bold">{formatDurationFromHours(supplyThisMonth)}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">For {selectedMonthLabel}</p>
              <StatChangeIndicator value={supplyChange} />
            </div>
            <div className="h-[120px] mt-4">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart accessibilityLayer data={supplyChartData}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip cursor={false} content={<FuturisticTooltip />} />
                  <Bar dataKey="supply" radius={[4, 4, 0, 0]} fill="var(--color-supply)" />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism-card">
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
            <div className="text-3xl font-bold text-primary">PKR {revenueThisMonth.toLocaleString('en-US', {maximumFractionDigits: 0})}</div>
             <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">For {selectedMonthLabel}</p>
              <StatChangeIndicator value={revenueChange} />
            </div>
            <div className="h-[120px] mt-4">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <AreaChart accessibilityLayer data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenueReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip cursor={false} content={<FuturisticTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="url(#colorRevenueReports)" />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

       <Card className="glassmorphism-card ai-summary-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <CardTitle>AI Revenue Projection</CardTitle>
            </div>
            <button
              onClick={handleProjection}
              disabled={isProjecting}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary/10 text-primary-foreground hover:bg-primary/20 h-9 px-3"
            >
              {isProjecting ? (
                <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />
              ) : (
                <TrendingUp className="mr-2 h-4 w-4" />
              )}
              <span>
                {isProjecting ? 'Projecting...' : `Project for ${format(addMonths(parseISO(selectedMonth), 1), 'MMMM')}`}
              </span>
            </button>
          </div>
          <CardDescription>
            Use historical data to forecast next month's revenue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProjecting && (
            <div className="space-y-2">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
          {projection && (
            <div>
              <p className="text-3xl font-bold text-primary">
                PKR {projection.projectedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-muted-foreground mt-2">{projection.reasoning}</p>
            </div>
          )}
          {!isProjecting && !projection && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Click the button to generate an AI-powered revenue projection for the next month.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="glassmorphism-card">
        <CardHeader>
          <CardTitle>Top Customers This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {topCustomers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No customer usage data for {selectedMonthLabel}.</p>
          ) : (
            <ul className="space-y-1">
              {topCustomers.map((customer) => (
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
                        <span className="font-mono text-sm text-primary">{formatDurationFromHours(customer.consumption)}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      <Card className="glassmorphism-card">
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-4 bg-muted/40 rounded-lg border border-border/50">
            <div className="p-3 rounded-full bg-primary/10 text-primary mr-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <p className="text-2xl font-bold">PKR {totalRevenue.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-muted/40 rounded-lg border border-border/50">
            <div className="p-3 rounded-full bg-destructive/10 text-destructive mr-4">
              <BadgeAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className="text-2xl font-bold">PKR {outstandingBalance.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-muted/40 rounded-lg border border-border/50">
            <div className="p-3 rounded-full bg-primary/10 text-primary mr-4">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Consumption</p>
              <p className="text-2xl font-bold">{formatDurationFromHours(averageConsumption)}<span className="text-sm font-normal text-muted-foreground">/cust</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
