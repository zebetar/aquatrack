
"use client"; // Required for Recharts

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Data cleared
const monthlySupplyData: { month: string, supply: number, revenue: number }[] = [];

const customerConsumptionData: { name: string, consumption: number, bill: number, paid: number }[] = [];


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
  
  const filteredSupplyData = monthlySupplyData; 
  const filteredCustomerData = customerConsumptionData;


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
            <CardTitle>Monthly Supply & Revenue (Hours & PKR)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {filteredSupplyData.length === 0 ? (
              <p className="text-muted-foreground flex h-full items-center justify-center">No supply data available for the selected period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredSupplyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
                  <Tooltip formatter={(value, name) => name === 'revenue' ? `PKR ${Number(value).toLocaleString('en-US')}`: `${value} hrs`}/>
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
            <CardTitle>Top Customers by Consumption (Hours)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {filteredCustomerData.length === 0 ? (
              <p className="text-muted-foreground flex h-full items-center justify-center">No customer consumption data available.</p>
            ) : (
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
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Customer Bill vs. Paid</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
             <p className="text-muted-foreground flex h-full items-center justify-center">No specific customer bill data to display.</p>
            {/* 
            // Example for when data exists:
            filteredCustomerData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{name: filteredCustomerData[1].name, bill: filteredCustomerData[1].bill, paid: filteredCustomerData[1].paid}]}> 
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `PKR ${Number(value).toLocaleString('en-US')}`}/>
                    <Legend />
                    <Line type="monotone" dataKey="bill" stroke="hsl(var(--destructive))" name="Total Bill (PKR)" />
                    <Line type="monotone" dataKey="paid" stroke="hsl(var(--chart-5))" name="Amount Paid (PKR)" />
                </LineChart>
            </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground flex h-full items-center justify-center">No specific customer bill data to display.</p>
            )
            */}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
