
"use client"; 

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, getMonth, getYear } from 'date-fns';
import { getAllMockCustomers, getAllMockUsageRecords, getAllMockPayments } from '@/lib/mock-data-store';
import type { Customer, WaterUsageRecord, Payment } from '@/types';

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
  bill: number; // total cost from usage
  paid: number; // total amount paid
}

export default function AdminReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [monthlySupplyData, setMonthlySupplyData] = useState<MonthlySupply[]>([]);
  const [customerConsumptionData, setCustomerConsumptionData] = useState<CustomerConsumption[]>([]);

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

    // Process Monthly Supply & Revenue
    const supplyMap = new Map<string, { supply: number, revenue: number }>();
    usageRecords.forEach(record => {
      const recordDate = new Date(record.date); // Ensure record.date is a Date object or string
      const monthKey = format(recordDate, 'yyyy-MM');
      const current = supplyMap.get(monthKey) || { supply: 0, revenue: 0 };
      current.supply += record.durationHours;
      current.revenue += record.cost;
      supplyMap.set(monthKey, current);
    });

    const allMonthlyData: MonthlySupply[] = Array.from(supplyMap.entries()).map(([month, data]) => ({
      month,
      monthLabel: format(parseISO(month + '-01'), 'MMM yyyy'), // Construct a valid date for formatting
      supply: data.supply,
      revenue: data.revenue,
    })).sort((a,b) => a.month.localeCompare(b.month)); // Sort by month
    setMonthlySupplyData(allMonthlyData);


    // Process Customer Consumption
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

    usageRecords.forEach(record => {
      const customerEntry = customerMap.get(record.customerId);
      if (customerEntry) {
        // Filter for selected month if needed, or show all-time
        // For this example, let's assume we want data for the *selectedMonth* context
        const recordDate = new Date(record.date);
        if (format(recordDate, 'yyyy-MM') === selectedMonth) {
            customerEntry.consumption += record.durationHours;
            customerEntry.bill += record.cost;
        }
      }
    });
    
    payments.forEach(payment => {
        const customerEntry = customerMap.get(payment.customerId);
        if (customerEntry) {
            // Filter for selected month if needed for payments too
            const paymentDate = new Date(payment.paymentDate);
            if (format(paymentDate, 'yyyy-MM') === selectedMonth) {
                 customerEntry.paid += payment.amountPaid;
            }
        }
    });

    setCustomerConsumptionData(Array.from(customerMap.values()));

  }, [selectedMonth]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  const filteredSupplyDataForChart = monthlySupplyData.filter(d => d.month === selectedMonth);
  
  const topCustomersByConsumption = customerConsumptionData
    .filter(c => c.consumption > 0) // Only customers with consumption in the selected month
    .sort((a,b) => b.consumption - a.consumption)
    .slice(0,10);

  // For Bill vs Paid, pick one customer (e.g., first with activity) or show aggregate
  // For simplicity, let's try to show the first customer from topConsumers who has bill/paid data
  const billVsPaidChartCustomer = topCustomersByConsumption.find(c => c.bill > 0 || c.paid > 0);
  const billVsPaidChartData = billVsPaidChartCustomer ? 
    [{ name: billVsPaidChartCustomer.name, bill: billVsPaidChartCustomer.bill, paid: billVsPaidChartCustomer.paid }] : [];


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
                  <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
                  <Tooltip formatter={(value, name) => name === 'revenue' ? `PKR ${Number(value).toLocaleString('en-US')}`: `${Number(value).toFixed(1)} hrs`}/>
                  <Legend />
                  <Bar yAxisId="left" dataKey="supply" fill="hsl(var(--primary))" name="Supply (Hours)" />
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
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} interval={0} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)} hrs`}/>
                  <Legend />
                  <Bar dataKey="consumption" fill="hsl(var(--primary))" name="Consumption (Hours)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Customer Bill vs. Paid ({billVsPaidChartCustomer ? billVsPaidChartCustomer.name : 'N/A'}, {monthOptions.find(m=>m.value === selectedMonth)?.label})</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {billVsPaidChartData.length === 0 ? (
              <p className="text-muted-foreground flex h-full items-center justify-center">No bill vs. paid data for a specific customer this month.</p>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={billVsPaidChartData}> 
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `PKR ${Number(value).toLocaleString('en-US')}`}/>
                    <Legend />
                    <Line type="monotone" dataKey="bill" stroke="hsl(var(--destructive))" name="Total Bill (PKR)" />
                    <Line type="monotone" dataKey="paid" stroke="hsl(var(--chart-5))" name="Amount Paid (PKR)" />
                </LineChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
