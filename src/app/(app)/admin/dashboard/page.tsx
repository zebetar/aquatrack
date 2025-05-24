
"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Droplets, CreditCard, BarChart3, BellRing } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  getAllMockCustomers, 
  getAllMockUsageRecords,
  getAllMockPayments,
  getAllAdminNotifications
} from '@/lib/mock-data-store';
import type { Customer, WaterUsageRecord, Payment, Notification as AppNotification } from '@/types';
import { format, isThisMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const KeyMetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  className, 
  href 
}: { 
  title: string, 
  value: string, 
  icon: React.ElementType, 
  description?: string, 
  className?: string,
  href?: string 
}) => {
  const cardInnerContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full group">
        <Card className={cn(
          "shadow-md hover:shadow-lg transition-all duration-150 ease-in-out hover:border-primary glassmorphism-card", 
          className
        )}>
          {cardInnerContent}
        </Card>
      </Link>
    );
  }
  return (
    <Card className={cn("shadow-md glassmorphism-card", className)}>
      {cardInnerContent}
    </Card>
  );
};

export default function AdminDashboardPage() {
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [monthlySupply, setMonthlySupply] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [outstandingBills, setOutstandingBills] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[]>([]);

  const loadDashboardData = useCallback(() => {
    const customers = getAllMockCustomers();
    const usageRecords = getAllMockUsageRecords();
    const payments = getAllMockPayments();
    const notifications = getAllAdminNotifications();

    setTotalCustomers(customers.length);

    const currentMonthUsage = usageRecords.filter(record => isThisMonth(new Date(record.date)));
    const currentSupply = currentMonthUsage.reduce((sum, record) => sum + record.durationHours, 0);
    
    // Revenue calculation should consider only current month's usage that led to cost
    const currentRevenue = currentMonthUsage.reduce((sum, record) => sum + record.cost, 0);
    
    setMonthlySupply(currentSupply);
    setMonthlyRevenue(currentRevenue);

    const totalDue = customers.reduce((sum, customer) => sum + (customer.balance > 0 ? customer.balance : 0), 0);
    setOutstandingBills(totalDue);
    
    setRecentNotifications(notifications.slice(0, 3)); // Show top 3 recent notifications

  }, []);

  useEffect(() => {
    loadDashboardData();
    // Interval to refresh data periodically, e.g., every 30 seconds
    const intervalId = setInterval(loadDashboardData, 30000);
    return () => clearInterval(intervalId);
  }, [loadDashboardData]);

  const metrics = [
    { 
      title: 'Total Customers', 
      value: totalCustomers.toString(), 
      icon: Users, 
      description: `${totalCustomers} active`,
      href: '/admin/customers'
    },
    { title: 'Monthly Supply (Hours)', value: `${monthlySupply.toFixed(1)} hrs`, icon: Droplets, description: 'Current month' },
    { title: 'Monthly Revenue', value: `PKR ${monthlyRevenue.toLocaleString('en-US')}`, icon: CreditCard, description: 'Current month' },
    { title: 'Outstanding Bills', value: `PKR ${outstandingBills.toLocaleString('en-US')}`, icon: BarChart3, description: 'Total amount due' },
  ];

  return (
    <>
      <PageHeader title="Admin Dashboard" description="Overview of water supply operations." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(metric => (
          <KeyMetricCard 
            key={metric.title} 
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            description={metric.description}
            href={metric.href}
          />
        ))}
      </div>
      <div className="mt-6">
        <Card className="shadow-md glassmorphism-card"> 
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <p className="text-muted-foreground">No recent notifications.</p>
            ) : (
              <ul className="space-y-3">
                {recentNotifications.map(activity => (
                  <li key={activity.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/30">
                    <BellRing className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{format(activity.createdAt, 'PP p')}</p>
                       {activity.linkTo && (
                         <Button variant="link" size="xs" asChild className="px-0 h-auto text-primary">
                           <Link href={activity.linkTo}>View</Link>
                         </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" asChild className="mt-4">
              <Link href="/admin/notifications">View All Notifications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
