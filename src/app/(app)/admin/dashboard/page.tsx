
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Droplets, CreditCard, BarChart3, BellRing, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback, memo, useMemo } from 'react'; 
import Link from 'next/link';
import { 
  getAllMockCustomers,
  getAllMockUsageRecords,
  getAllAdminNotifications,
} from '@/lib/mock-data-store';
import type { Customer, WaterUsageRecord, Notification as AppNotification, CustomerMonthlyUsage } from '@/types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn, formatDurationFromHours } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MonthlySupplyDetailsDialog } from '@/components/admin/dashboard/monthly-supply-details-dialog';
import { OutstandingBillsDialog } from '@/components/admin/dashboard/outstanding-bills-dialog';
import { MonthlyRevenueDetailsDialog } from '@/components/admin/dashboard/monthly-revenue-details-dialog';
import { useToast } from '@/hooks/use-toast';

const KeyMetricCard = memo(({ 
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
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <div className="p-2 bg-accent/10 dark:bg-accent/20 rounded-full group-hover:bg-accent/20 dark:group-hover:bg-accent/30 transition-colors">
          <Icon className="h-5 w-5 text-primary dark:text-accent" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </>
  );

  const cardClasses = cn(
    "glassmorphism-card transition-all duration-300 ease-out",
    className,
    (href || onClick) && "hover:shadow-lg hover:border-primary/50 dark:hover:border-accent/70 hover:-translate-y-1 cursor-pointer group" 
  );

  if (href && !onClick) {
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
});
KeyMetricCard.displayName = 'KeyMetricCard'; 


export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [totalCustomers, setTotalCustomers] = useState(0);
  const [monthlySupply, setMonthlySupply] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [outstandingBillsValue, setOutstandingBillsValue] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<AppNotification[]>([]);
  
  // Data for dialogs
  const [isDialogDataLoading, setIsDialogDataLoading] = useState(false);
  const [customersWithMonthlyUsageData, setCustomersWithMonthlyUsageData] = useState<CustomerMonthlyUsage[]>([]);
  const [customersWithOutstandingBills, setCustomersWithOutstandingBills] = useState<Customer[]>([]);
  const [monthlyUsageRecords, setMonthlyUsageRecords] = useState<WaterUsageRecord[]>([]);

  // Dialog open states
  const [isMonthlySupplyDialogOpen, setIsMonthlySupplyDialogOpen] = useState(false);
  const [isOutstandingBillsDialogOpen, setIsOutstandingBillsDialogOpen] = useState(false);
  const [isMonthlyRevenueDialogOpen, setIsMonthlyRevenueDialogOpen] = useState(false);

  const customersWithMonthlyRevenueData = useMemo(() => {
    return customersWithMonthlyUsageData
      .filter(c => c.cost > 0)
      .sort((a, b) => b.cost - a.cost);
  }, [customersWithMonthlyUsageData]);


  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const firstDay = startOfMonth(today);
      const lastDay = endOfMonth(today);

      // Using mock data to prevent Firestore permission errors
      const allCustomers = getAllMockCustomers();
      const allUsageRecords = getAllMockUsageRecords();
      const allNotifications = getAllAdminNotifications();
      
      const usageRecordsThisMonth = allUsageRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= firstDay && recordDate <= lastDay;
      });

      const outstandingCustomers = allCustomers.filter(c => c.balance > 0);

      setTotalCustomers(allCustomers.length);
      setMonthlyUsageRecords(usageRecordsThisMonth);
      setCustomersWithOutstandingBills(outstandingCustomers);
      setRecentNotifications(allNotifications.slice(0, 3));

      const currentSupply = usageRecordsThisMonth.reduce((sum, record) => sum + record.durationHours, 0);
      const currentRevenue = usageRecordsThisMonth.reduce((sum, record) => sum + record.cost, 0);
      setMonthlySupply(currentSupply);
      setMonthlyRevenue(currentRevenue);

      const totalDue = outstandingCustomers.reduce((sum, customer) => sum + customer.balance, 0);
      setOutstandingBillsValue(totalDue);
      
    } catch (error) {
      console.error("Failed to load dashboard data from mock store", error);
      toast({
        variant: "destructive",
        title: "Error Loading Dashboard",
        description: "Could not retrieve data. Check console for details.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const loadAndProcessDialogData = useCallback(async () => {
      if (isDialogDataLoading) return;
      setIsDialogDataLoading(true);
      try {
        const customers = getAllMockCustomers();
        
        const customerUsageMap = new Map<string, { name: string, usageHours: number, cost: number }>();
        customers.forEach(c => customerUsageMap.set(c.id, { name: c.name, usageHours: 0, cost: 0 }));

        monthlyUsageRecords.forEach(record => { 
          const entry = customerUsageMap.get(record.customerId);
          if (entry) {
            entry.usageHours += record.durationHours;
            entry.cost += record.cost;
          }
        });
      
        const processedDialogData: CustomerMonthlyUsage[] = Array.from(customerUsageMap.entries())
          .map(([id, data]) => ({ id, ...data }))
          .filter(item => item.usageHours > 0 || item.cost > 0) 
          .sort((a,b) => b.usageHours - a.usageHours);
          
        setCustomersWithMonthlyUsageData(processedDialogData);
      } catch (error) {
        console.error("Failed to load detailed customer data for dialog", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load detailed data for the dialog.",
        });
      } finally {
        setIsDialogDataLoading(false);
      }
  }, [isDialogDataLoading, monthlyUsageRecords, toast]);

  const handleOpenSupplyDialog = async () => {
    setIsMonthlySupplyDialogOpen(true);
    await loadAndProcessDialogData();
  };

  const handleOpenRevenueDialog = async () => {
    setIsMonthlyRevenueDialogOpen(true);
    if (customersWithMonthlyUsageData.length === 0) {
      await loadAndProcessDialogData();
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center mt-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading dashboard data...</p>
      </div>
    );
  }

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
      onClick: handleOpenSupplyDialog
    },
    { 
      title: 'Monthly Revenue', 
      value: `PKR ${monthlyRevenue.toLocaleString('en-US')}`, 
      icon: CreditCard, 
      description: 'Current month',
      onClick: handleOpenRevenueDialog
    },
    { 
      title: 'Outstanding Bills', 
      value: `PKR ${outstandingBillsValue.toLocaleString('en-US')}`, 
      icon: BarChart3, 
      description: 'Total amount due',
      onClick: () => setIsOutstandingBillsDialogOpen(true)
    },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        {metrics.map(metric => (
          <KeyMetricCard 
            key={metric.title} 
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            description={metric.description}
            href={metric.href}
            onClick={metric.onClick}
          />
        ))}
      </div>
      <div className="mt-8">
        <Card className="glassmorphism-card"> 
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <p className="text-muted-foreground">No recent notifications.</p>
            ) : (
              <ul className="space-y-3">
                {recentNotifications.map(activity => (
                  <li key={activity.id} className="flex items-start space-x-3 p-3 rounded-md hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors">
                    <div className="p-1.5 bg-primary/10 dark:bg-primary/20 rounded-full">
                       <BellRing className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>
                    <div>
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{!isNaN(new Date(activity.createdAt).getTime()) ? format(new Date(activity.createdAt), 'PP p') : 'Invalid date'}</p>
                       {activity.linkTo && (
                         <Button variant="link" size="xs" asChild className="px-0 h-auto text-primary dark:text-accent">
                           <Link href={activity.linkTo}>View</Link>
                         </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" asChild className="mt-6">
              <Link href="/admin/notifications">
                <span>View All Notifications</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <MonthlySupplyDetailsDialog
        isOpen={isMonthlySupplyDialogOpen}
        onClose={() => setIsMonthlySupplyDialogOpen(false)}
        data={customersWithMonthlyUsageData.filter(c => c.usageHours > 0)}
        isLoading={isDialogDataLoading}
      />
      <MonthlyRevenueDetailsDialog
        isOpen={isMonthlyRevenueDialogOpen}
        onClose={() => setIsMonthlyRevenueDialogOpen(false)}
        data={customersWithMonthlyRevenueData}
        isLoading={isDialogDataLoading}
      />
      <OutstandingBillsDialog 
        isOpen={isOutstandingBillsDialogOpen}
        onClose={() => setIsOutstandingBillsDialogOpen(false)}
        data={customersWithOutstandingBills}
      />
    </>
  );
}
    

    
