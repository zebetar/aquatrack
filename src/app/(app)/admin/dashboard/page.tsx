
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
import type { Customer, WaterUsageRecord, Payment, Notification as AppNotification, CustomerMonthlyUsage } from '@/types';
import { format, isThisMonth } from 'date-fns';
import { cn, formatDurationFromHours } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MonthlySupplyDetailsDialog } from '@/components/admin/dashboard/monthly-supply-details-dialog';
import { OutstandingBillsDialog } from '@/components/admin/dashboard/outstanding-bills-dialog'; // New Import

const KeyMetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  className, 
  href,
  onClick,
}: { 
  title: string, 
  value: string, 
  icon: React.ElementType, 
  description?: string, 
  className?: string,
  href?: string,
  onClick?: () => void;
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

  const cardClasses = cn(
    "shadow-md glassmorphism-card", 
    className,
    href || onClick ? "hover:shadow-lg transition-all duration-150 ease-in-out hover:border-primary" : ""
  );

  if (href && !onClick) { // Prioritize onClick if both are present for cards that become dialog triggers
    return (
      <Link href={href} className="block h-full group">
        <Card className={cardClasses}>
          {cardInnerContent}
        </Card>
      </Link>
    );
  }
  
  if (onClick) {
    return (
       <div onClick={onClick} className="cursor-pointer h-full group">
        <Card className={cn(cardClasses, "h-full")}>
          {cardInnerContent}
        </Card>
      </div>
    );
  }

  return (
    <Card className={cardClasses}>
      {cardInnerContent}
    </Card>
  );
};

export default function AdminDashboardPage() {
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [monthlySupply, setMonthlySupply] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [outstandingBillsValue, setOutstandingBillsValue] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[]>([]);
  
  const [isMonthlySupplyDialogOpen, setIsMonthlySupplyDialogOpen] = useState(false);
  const [customersWithMonthlyUsageData, setCustomersWithMonthlyUsageData] = useState<CustomerMonthlyUsage[]>([]);

  const [isOutstandingBillsDialogOpen, setIsOutstandingBillsDialogOpen] = useState(false); // New state for outstanding bills dialog
  const [customersWithOutstandingBills, setCustomersWithOutstandingBills] = useState<Customer[]>([]); // New state for dialog data


  const loadDashboardData = useCallback(() => {
    const customers = getAllMockCustomers();
    const usageRecords = getAllMockUsageRecords();
    const payments = getAllMockPayments();
    const notifications = getAllAdminNotifications();

    setTotalCustomers(customers.length);

    const currentMonthUsageRecords = usageRecords.filter(record => isThisMonth(new Date(record.date)));
    const currentSupply = currentMonthUsageRecords.reduce((sum, record) => sum + record.durationHours, 0);
    const currentRevenue = currentMonthUsageRecords.reduce((sum, record) => sum + record.cost, 0);
    
    setMonthlySupply(currentSupply);
    setMonthlyRevenue(currentRevenue);

    const customersWithDues = customers.filter(c => c.balance > 0).sort((a,b) => b.balance - a.balance);
    setCustomersWithOutstandingBills(customersWithDues);
    const totalDue = customersWithDues.reduce((sum, customer) => sum + customer.balance, 0);
    setOutstandingBillsValue(totalDue);
    
    setRecentNotifications(notifications.slice(0, 3)); 

    // Prepare data for monthly supply dialog
    const customerUsageMap = new Map<string, { name: string, usageHours: number, cost: number }>();
    customers.forEach(c => customerUsageMap.set(c.id, { name: c.name, usageHours: 0, cost: 0 }));

    currentMonthUsageRecords.forEach(record => {
      const entry = customerUsageMap.get(record.customerId);
      if (entry) {
        entry.usageHours += record.durationHours;
        entry.cost += record.cost;
      }
    });
    
    const processedDialogData: CustomerMonthlyUsage[] = Array.from(customerUsageMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .filter(item => item.usageHours > 0) 
      .sort((a,b) => b.usageHours - a.usageHours); 
    setCustomersWithMonthlyUsageData(processedDialogData);

  }, []);

  useEffect(() => {
    loadDashboardData();
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
    { 
      title: 'Monthly Supply', 
      value: formatDurationFromHours(monthlySupply), 
      icon: Droplets, 
      description: 'Current month',
      onClick: () => setIsMonthlySupplyDialogOpen(true)
    },
    { title: 'Monthly Revenue', value: `PKR ${monthlyRevenue.toLocaleString('en-US')}`, icon: CreditCard, description: 'Current month' },
    { 
      title: 'Outstanding Bills', 
      value: `PKR ${outstandingBillsValue.toLocaleString('en-US')}`, 
      icon: BarChart3, 
      description: 'Total amount due',
      onClick: () => setIsOutstandingBillsDialogOpen(true) // Changed from href to onClick
    },
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
            onClick={metric.onClick}
            className={metric.href || metric.onClick ? "hover:ring-2 hover:ring-primary/50" : ""}
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
      <MonthlySupplyDetailsDialog
        isOpen={isMonthlySupplyDialogOpen}
        onClose={() => setIsMonthlySupplyDialogOpen(false)}
        data={customersWithMonthlyUsageData}
      />
      <OutstandingBillsDialog 
        isOpen={isOutstandingBillsDialogOpen}
        onClose={() => setIsOutstandingBillsDialogOpen(false)}
        data={customersWithOutstandingBills}
      />
    </>
  );
}
