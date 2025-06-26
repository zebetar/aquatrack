
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Droplets, CreditCard, BarChart3, Loader2, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback, memo, useMemo } from 'react'; 
import Link from 'next/link';
import { 
  getAllMockCustomers,
  getAllMockUsageRecords,
} from '@/lib/mock-data-store';
import type { Customer, WaterUsageRecord, CustomerMonthlyUsage } from '@/types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn, formatDurationFromHours } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MonthlySupplyDetailsDialog } from '@/components/admin/dashboard/monthly-supply-details-dialog';
import { OutstandingBillsDialog } from '@/components/admin/dashboard/outstanding-bills-dialog';
import { MonthlyRevenueDetailsDialog } from '@/components/admin/dashboard/monthly-revenue-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [topOutstandingCustomers, setTopOutstandingCustomers] = useState<Customer[]>([]);
  
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

      const allCustomers = getAllMockCustomers();
      const allUsageRecords = getAllMockUsageRecords();
      
      const usageRecordsThisMonth = allUsageRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= firstDay && recordDate <= lastDay;
      });

      const outstandingCustomers = allCustomers.filter(c => c.balance > 0);

      setTotalCustomers(allCustomers.length);
      setMonthlyUsageRecords(usageRecordsThisMonth);
      setCustomersWithOutstandingBills(outstandingCustomers);
      
      const sortedOutstanding = [...outstandingCustomers].sort((a,b) => b.balance - a.balance);
      setTopOutstandingCustomers(sortedOutstanding.slice(0, 5));

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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Outstanding Bills</CardTitle>
             <Button asChild variant="link" size="sm">
                <Link href="/admin/reports/outstanding-bills">View All</Link>
             </Button>
          </CardHeader>
          <CardContent>
            {topOutstandingCustomers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No outstanding bills. Great job!</p>
            ) : (
              <ul className="space-y-1">
                {topOutstandingCustomers.map((customer) => (
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
                        <span className="font-mono text-sm text-destructive">PKR {customer.balance.toLocaleString()}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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
    

    

