
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Droplets, CreditCard, BarChart3, ListChecks, Zap } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { 
  getAllMockCustomers, 
  getAllMockUsageRecords,
  getAllMockPayments
} from '@/lib/mock-data-store';
import type { Customer, WaterUsageRecord, Payment } from '@/types';
import { format, isThisMonth } from 'date-fns';

const KeyMetricCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description?: string }) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

type RecentActivityItem = {
  id: string;
  type: 'usage' | 'payment' | 'customer';
  description: string;
  date: Date;
  icon: React.ElementType;
};

export default function AdminDashboardPage() {
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [monthlySupply, setMonthlySupply] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [outstandingBills, setOutstandingBills] = useState(0);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);

  const loadDashboardData = useCallback(() => {
    const customers = getAllMockCustomers();
    const usageRecords = getAllMockUsageRecords();
    const payments = getAllMockPayments();

    // Total Customers
    setTotalCustomers(customers.length);

    // Monthly Supply & Revenue (for current month)
    const currentMonthUsage = usageRecords.filter(record => isThisMonth(new Date(record.date)));
    const currentSupply = currentMonthUsage.reduce((sum, record) => sum + record.durationHours, 0);
    const currentRevenue = currentMonthUsage.reduce((sum, record) => sum + record.cost, 0);
    setMonthlySupply(currentSupply);
    setMonthlyRevenue(currentRevenue);

    // Outstanding Bills
    const totalDue = customers.reduce((sum, customer) => sum + (customer.balance > 0 ? customer.balance : 0), 0);
    setOutstandingBills(totalDue);
    
    // Recent Activities (last 5, sorted by date)
    const activities: RecentActivityItem[] = [];
    usageRecords.forEach(r => activities.push({ 
        id: `usage-${r.id}`, 
        type: 'usage', 
        description: `Usage logged: ${r.durationHours.toFixed(1)} hrs for ${r.customerName}`, 
        date: new Date(r.createdAt),
        icon: Droplets
    }));
    payments.forEach(p => activities.push({ 
        id: `payment-${p.id}`, 
        type: 'payment', 
        description: `Payment recorded: PKR ${p.amountPaid.toLocaleString()} from ${p.customerName}`, 
        date: new Date(p.createdAt),
        icon: CreditCard
    }));
    customers.forEach(c => activities.push({
        id: `customer-${c.id}`,
        type: 'customer',
        description: `New customer added: ${c.name}`,
        date: new Date(c.createdAt),
        icon: Users
    }));

    activities.sort((a,b) => b.date.getTime() - a.date.getTime());
    setRecentActivities(activities.slice(0, 5));

  }, []);

  useEffect(() => {
    loadDashboardData();
    // Since mock-data-store doesn't emit events, we might need a way to trigger re-load
    // For now, it loads on mount. Re-navigation to dashboard would re-load.
  }, [loadDashboardData]);

  const metrics = [
    { title: 'Total Customers', value: totalCustomers.toString(), icon: Users, description: `${totalCustomers} active` },
    { title: 'Monthly Supply (Hours)', value: `${monthlySupply.toFixed(1)} hrs`, icon: Droplets, description: 'Current month' },
    { title: 'Monthly Revenue', value: `PKR ${monthlyRevenue.toLocaleString('en-US')}`, icon: CreditCard, description: 'Current month' },
    { title: 'Outstanding Bills', value: `PKR ${outstandingBills.toLocaleString('en-US')}`, icon: BarChart3, description: 'Total amount due' },
  ];

  return (
    <>
      <PageHeader title="Admin Dashboard" description="Overview of water supply operations." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(metric => (
          <KeyMetricCard key={metric.title} {...metric} />
        ))}
      </div>
      <div className="mt-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground">No recent activity found.</p>
            ) : (
              <ul className="space-y-3">
                {recentActivities.map(activity => (
                  <li key={activity.id} className="flex items-start space-x-3">
                    <activity.icon className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{format(activity.date, 'PP p')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
