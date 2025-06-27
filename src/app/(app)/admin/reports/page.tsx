
"use client"; 

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { getAllMockUsageRecords, getAllMockCustomers } from '@/lib/mock-data-store';
import type { Customer } from '@/types';
import { formatDurationFromHours, cn } from '@/lib/utils';
import { Loader2, ArrowUp, ArrowDown, ChevronRight, TrendingUp, BadgeAlert, Droplets } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';

interface MonthlyData {
  month: string;
  monthLabel: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  
  const [supplyThisMonth, setSupplyThisMonth] = useState(0);
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [supplyChange, setSupplyChange] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  
  const [topCustomers, setTopCustomers] = useState<CustomerConsumption[]>([]);
  
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [averageConsumption, setAverageConsumption] = useState(0);

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

  const loadReportsData = useCallback(() => {
    setIsLoading(true);
    
    const allUsageRecords = getAllMockUsageRecords();
    const allCustomers = getAllMockCustomers();
    const selectedDate = parseISO(selectedMonth);

    const historicalMap = new Map<string, { supply: number, revenue: number }>();
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(selectedDate, i);
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

    const processedChartData: MonthlyData[] = Array.from(historicalMap.entries()).map(([month, data]) => ({
      month,
      monthLabel: format(parseISO(month + '-01'), 'MMM'),
      ...data,
    }));
    setChartData(processedChartData);

    const firstDayOfMonth = startOfMonth(selectedDate);
    const lastDayOfMonth = endOfMonth(selectedDate);
    const lastMonthDate = subMonths(selectedDate, 1);
    const firstDayOfLastMonth = startOfMonth(lastMonthDate);
    const lastDayOfLastMonth = endOfMonth(lastMonthDate);

    const usageThisMonth = allUsageRecords.filter(r => new Date(r.date) >= firstDayOfMonth && new Date(r.date) <= lastDayOfMonth);
    const usageLastMonth = allUsageRecords.filter(r => new Date(r.date) >= firstDayOfLastMonth && new Date(r.date) <= lastDayOfLastMonth);
    
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
    const totalOutstanding = allCustomers.reduce((sum, customer) => sum + customer.balance, 0);
    setOutstandingBalance(totalOutstanding);
    const activeCustomersThisMonth = customerConsumptionMap.size;
    setAverageConsumption(activeCustomersThisMonth > 0 ? currentMonthSupply / activeCustomersThisMonth : 0);

    setIsLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || "Selected Month";

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center mt-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Supply Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatDurationFromHours(supplyThisMonth)}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">For {selectedMonthLabel}</p>
              <StatChangeIndicator value={supplyChange} />
            </div>
            <div className="h-[120px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}} formatter={(value) => [formatDurationFromHours(Number(value)), "Supply"]}/>
                  <Bar dataKey="supply" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism-card">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">PKR {revenueThisMonth.toLocaleString('en-US', {maximumFractionDigits: 0})}</div>
             <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">For {selectedMonthLabel}</p>
              <StatChangeIndicator value={revenueChange} />
            </div>
            <div className="h-[120px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip cursor={{stroke: 'hsl(var(--primary))', strokeDasharray: '3 3'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}} formatter={(value) => [`PKR ${Number(value).toLocaleString()}`, "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                 </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
