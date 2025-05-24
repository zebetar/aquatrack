"use client"; // Required for Recharts

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const monthlySupplyData = [
  { month: 'Jan', supply: 600, revenue: 600 * 1200 },
  { month: 'Feb', supply: 750, revenue: 750 * 1200 },
  { month: 'Mar', supply: 820, revenue: 820 * 1200 },
  { month: 'Apr', supply: 700, revenue: 700 * 1200 },
  { month: 'May', supply: 900, revenue: 900 * 1200 },
  { month: 'Jun', supply: 850, revenue: 850 * 1200 },
];

const customerConsumptionData = [
  { name: 'Aarav S.', consumption: 12, bill: 14400, paid: 14000 },
  { name: 'Priya P.', consumption: 15, bill: 18000, paid: 18000 },
  { name: 'Rohan M.', consumption: 8, bill: 9600, paid: 9600 },
  { name: 'Sneha R.', consumption: 10, bill: 12000, paid: 10000 },
  { name: 'Vikram B.', consumption: 18, bill: 21600, paid: 20000 },
];


export default function AdminReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

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
  
  // Filtered data based on selected month (example)
  const filteredSupplyData = monthlySupplyData; // Replace with actual filtering logic
  const filteredCustomerData = customerConsumptionData; // Replace with actual filtering logic


  return (
    <>
      <PageHeader 
        title="Reports" 
        description="Analyze water supply data and revenue."
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
            <CardTitle>Monthly Supply & Revenue (Hours & ₹)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredSupplyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
                <Tooltip formatter={(value, name) => name === 'revenue' ? `₹${Number(value).toLocaleString('en-IN')}`: `${value} hrs`}/>
                <Legend />
                <Bar yAxisId="left" dataKey="supply" fill="hsl(var(--primary))" name="Supply (Hours)" />
                <Bar yAxisId="right" dataKey="revenue" fill="hsl(var(--chart-2))" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Top Customers by Consumption (Hours)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredCustomerData.sort((a,b) => b.consumption - a.consumption).slice(0,5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => `${value} hrs`}/>
                <Legend />
                <Bar dataKey="consumption" fill="hsl(var(--primary))" name="Consumption (Hours)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Customer Bill vs. Paid (Example Customer: Priya P.)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {/* This chart would typically fetch data for a selected customer */}
            {/* For demo, using Priya P. from customerConsumptionData */}
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{name: filteredCustomerData[1].name, bill: filteredCustomerData[1].bill, paid: filteredCustomerData[1].paid}]}> 
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}/>
                    <Legend />
                    <Line type="monotone" dataKey="bill" stroke="hsl(var(--destructive))" name="Total Bill (₹)" />
                    <Line type="monotone" dataKey="paid" stroke="hsl(var(--chart-5))" name="Amount Paid (₹)" />
                </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
