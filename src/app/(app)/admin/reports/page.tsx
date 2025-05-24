
"use client"; 

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, subMonths, parseISO } from 'date-fns';
import { getAllMockCustomers, getAllMockUsageRecords, getAllMockPayments } from '@/lib/mock-data-store';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { formatDurationFromHours } from '@/lib/utils';

interface MonthlySupply {
  month: string; // "YYYY-MM"
  monthLabel: string; // "MMM yyyy"
  supply: number;
  revenue: number;
}

interface CustomerConsumption {
  id: string;
  name: string;
  consumption: number;
  bill: number; // total cost from usage for the selected month
  paid: number; // total amount paid for the selected month
}

interface MonthlyFinancialSummary {
  name: string; // e.g., "Aggregate"
  bill: number; // Total billed for the month
  paid: number; // Total paid for the month
}

export default function AdminReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [monthlySupplyData, setMonthlySupplyData] = useState<MonthlySupply[]>([]);
  const [customerConsumptionData, setCustomerConsumptionData] = useState<CustomerConsumption[]>([]);
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
    const customers = getAllMockCustomers();
    const usageRecords = getAllMockUsageRecords();
    const payments = getAllMockPayments();

    // Process Monthly Supply & Revenue (all-time for trend, chart will filter)
    const supplyMap = new Map<string, { supply: number, revenue: number }>();
    usageRecords.forEach(record => {
      const recordDate = new Date(record.date);
      const monthKey = format(recordDate, 'yyyy-MM');
      const current = supplyMap.get(monthKey) || { supply: 0, revenue: 0 };
      current.supply += record.durationHours;
      current.revenue += record.cost;
      supplyMap.set(monthKey, current);
    });

    const allMonthlyData: MonthlySupply[] = Array.from(supplyMap.entries()).map(([month, data]) => ({
      month,
      monthLabel: format(parseISO(month + '-01'), 'MMM yyyy'),
      supply: data.supply,
      revenue: data.revenue,
    })).sort((a,b) => a.month.localeCompare(b.month));
    setMonthlySupplyData(allMonthlyData);

    // Process Customer Consumption & Aggregate Financials for the selectedMonth
    const customerMap = new Map<string, CustomerConsumption>();
    customers.forEach(customer => {
      customerMap.set(customer.id, {
        id: customer.id,
        name: customer.name,
        consumption: 0,
        bill: 0,
        paid: 0,
      });
    });

    let totalBilledThisMonth = 0;
    let totalPaidThisMonth = 0;

    usageRecords.forEach(record => {
      const customerEntry = customerMap.get(record.customerId);
      const recordDate = new Date(record.date);
      if (format(recordDate, 'yyyy-MM') === selectedMonth) {
        if (customerEntry) {
          customerEntry.consumption += record.durationHours;
          customerEntry.bill += record.cost;
        }
        totalBilledThisMonth += record.cost;
      }
    });
    
    payments.forEach(payment => {
      const customerEntry = customerMap.get(payment.customerId);
      const paymentDate = new Date(payment.paymentDate);
      if (format(paymentDate, 'yyyy-MM') === selectedMonth) {
        if (customerEntry) {
           customerEntry.paid += payment.amountPaid;
        }
        totalPaidThisMonth += payment.amountPaid;
      }
    });

    setCustomerConsumptionData(Array.from(customerMap.values()));
    setMonthlyFinancialSummary([{ name: monthOptions.find(m=>m.value === selectedMonth)?.label || "Selected Month", bill: totalBilledThisMonth, paid: totalPaidThisMonth }]);

  }, [selectedMonth, monthOptions]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  const filteredSupplyDataForChart = monthlySupplyData.filter(d => d.month === selectedMonth);
  
  const topCustomersByConsumption = customerConsumptionData
    .filter(c => c.consumption > 0)
    .sort((a,b) => b.consumption - a.consumption)
    .slice(0,10);

  return (
    <>
      <PageHeader 
        title="Reports" 
        description="Analyze water supply data and revenue for the selected month."
        actions={
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                    {monthOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        }
      />
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Supply & Revenue for {monthOptions.find(m=>m.value === selectedMonth)?.label}</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {filteredSupplyDataForChart.length === 0 ? (
              <p className="text-muted-foreground flex h-full items-center justify-center">No supply data available for {monthOptions.find(m=>m.value === selectedMonth)?.label}.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredSupplyDataForChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" tickFormatter={(value) => formatDurationFromHours(value)} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
                  <Tooltip formatter={(value, name) => name === 'revenue' ? `PKR ${Number(value).toLocaleString('en-US')}`: formatDurationFromHours(Number(value))}/>
                  <Legend />
                  <Bar yAxisId="left" dataKey="supply" fill="hsl(var(--chart-1))" name="Supply" />
                  <Bar yAxisId="right" dataKey="revenue" fill="hsl(var(--chart-2))" name="Revenue (PKR)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Top Customers by Consumption ({monthOptions.find(m=>m.value === selectedMonth)?.label})</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {topCustomersByConsumption.length === 0 ? (
              <p className="text-muted-foreground flex h-full items-center justify-center">No customer consumption data for {monthOptions.find(m=>m.value === selectedMonth)?.label}.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCustomersByConsumption} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatDurationFromHours(value)} />
                  <YAxis dataKey="name" type="category" width={100} interval={0} />
                  <Tooltip formatter={(value) => formatDurationFromHours(Number(value))}/>
                  <Legend />
                  <Bar dataKey="consumption" fill="hsl(var(--chart-3))" name="Consumption" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Monthly Financial Summary ({monthOptions.find(m=>m.value === selectedMonth)?.label})</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {monthlyFinancialSummary.length === 0 || (monthlyFinancialSummary[0].bill === 0 && monthlyFinancialSummary[0].paid === 0) ? (
              <p className="text-muted-foreground flex h-full items-center justify-center">No billing or payment data for this month.</p>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyFinancialSummary}> 
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `PKR ${Number(value).toLocaleString('en-US')}`}/>
                    <Legend />
                    <Line type="monotone" dataKey="bill" stroke="hsl(var(--destructive))" name="Total Billed (PKR)" activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="paid" stroke="hsl(var(--chart-5))" name="Total Paid (PKR)" activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
