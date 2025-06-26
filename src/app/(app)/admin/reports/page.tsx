
"use client"; 

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { getAllMockUsageRecords, getAllMockPayments } from '@/lib/mock-data-store';
import type { WaterUsageRecord, Payment } from '@/types';
import { formatDurationFromHours } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MonthlyData {
  month: string; // "YYYY-MM"
  monthLabel: string; // "MMM yy"
  supply: number;
  revenue: number;
}

interface CustomerConsumption {
  name: string;
  consumption: number;
}

interface MonthlyFinancialSummary {
  name: string;
  Billed: number;
  Paid: number;
}

export default function AdminReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  const [historicalData, setHistoricalData] = useState<MonthlyData[]>([]);
  const [monthlyCustomerData, setMonthlyCustomerData] = useState<CustomerConsumption[]>([]);
  const [monthlyFinancialSummary, setMonthlyFinancialSummary] = useState<MonthlyFinancialSummary[]>([]);

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
    
    const usageRecords = getAllMockUsageRecords();
    const payments = getAllMockPayments();

    // 1. Process historical data for the 12-month trend chart
    const historicalMap = new Map<string, { supply: number, revenue: number }>();
    for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'yyyy-MM');
        historicalMap.set(monthKey, { supply: 0, revenue: 0 });
    }

    usageRecords.forEach(record => {
        const recordDate = new Date(record.date);
        const monthKey = format(recordDate, 'yyyy-MM');
        if (historicalMap.has(monthKey)) {
            const current = historicalMap.get(monthKey)!;
            current.supply += record.durationHours;
            current.revenue += record.cost;
        }
    });

    const allHistoricalData: MonthlyData[] = Array.from(historicalMap.entries()).map(([month, data]) => ({
      month,
      monthLabel: format(parseISO(month + '-01'), 'MMM yy'),
      ...data,
    }));
    setHistoricalData(allHistoricalData);

    // 2. Process data for the selected month
    const firstDayOfMonth = startOfMonth(parseISO(selectedMonth));
    const lastDayOfMonth = endOfMonth(parseISO(selectedMonth));

    const usageThisMonth = usageRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= firstDayOfMonth && recordDate <= lastDayOfMonth;
    });

    const paymentsThisMonth = payments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        return paymentDate >= firstDayOfMonth && paymentDate <= lastDayOfMonth;
    });

    const customerConsumptionMap = new Map<string, number>();
    usageThisMonth.forEach(record => {
        const currentConsumption = customerConsumptionMap.get(record.customerName) || 0;
        customerConsumptionMap.set(record.customerName, currentConsumption + record.durationHours);
    });

    const topCustomers = Array.from(customerConsumptionMap.entries())
        .map(([name, consumption]) => ({ name, consumption }))
        .sort((a,b) => b.consumption - a.consumption)
        .slice(0, 10);
    setMonthlyCustomerData(topCustomers);

    const totalBilled = usageThisMonth.reduce((sum, r) => sum + r.cost, 0);
    const totalPaid = paymentsThisMonth.reduce((sum, p) => sum + p.amountPaid, 0);

    setMonthlyFinancialSummary([{ name: 'Summary', Billed: totalBilled, Paid: totalPaid }]);

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
    <div className="mt-6 space-y-8">
      
      <Card className="shadow-lg glassmorphism-card">
        <CardHeader>
          <CardTitle>Historical Supply & Revenue</CardTitle>
          <CardDescription>Trends over the last 12 months.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="monthLabel" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="left" stroke="hsl(var(--chart-1))" tickFormatter={(value) => formatDurationFromHours(value)} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" tickFormatter={(value) => `PKR ${Number(value / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                }}
                formatter={(value, name) => {
                  if (name === 'Revenue') return [`PKR ${Number(value).toLocaleString('en-US')}`, 'Revenue'];
                  return [formatDurationFromHours(Number(value)), 'Supply'];
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="supply" name="Supply" stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-lg bg-card/50">
        <h2 className="text-xl font-bold">Monthly Breakdown for:</h2>
         <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
                {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-md glassmorphism-card">
          <CardHeader>
            <CardTitle>Top Customers by Consumption</CardTitle>
            <CardDescription>For {selectedMonthLabel}</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {monthlyCustomerData.length === 0 ? (
              <p className="text-muted-foreground flex h-full items-center justify-center">No customer consumption data for {selectedMonthLabel}.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCustomerData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => formatDurationFromHours(value)} />
                  <YAxis dataKey="name" type="category" width={100} interval={0} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    cursor={{fill: 'hsl(var(--muted))'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))'}}
                    formatter={(value) => [formatDurationFromHours(Number(value)), "Consumption"]}
                  />
                  <Bar dataKey="consumption" fill="hsl(var(--chart-3))" name="Consumption" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md glassmorphism-card">
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>For {selectedMonthLabel}</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {monthlyFinancialSummary[0].Billed === 0 && monthlyFinancialSummary[0].Paid === 0 ? (
              <p className="text-muted-foreground flex h-full items-center justify-center">No financial data for {selectedMonthLabel}.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFinancialSummary} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `PKR ${Number(value/1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" hide />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--muted))'}}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))'}}
                      formatter={(value) => [`PKR ${Number(value).toLocaleString('en-US')}`, 'Amount']}
                    />
                    <Legend />
                    <Bar dataKey="Billed" fill="hsl(var(--destructive))" name="Total Billed" barSize={30} />
                    <Bar dataKey="Paid" fill="hsl(var(--chart-5))" name="Total Paid" barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    