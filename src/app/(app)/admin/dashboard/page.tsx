import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Droplets, CreditCard, BarChart3 } from 'lucide-react';

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

export default function AdminDashboardPage() {
  // Placeholder data
  const metrics = [
    { title: 'Total Customers', value: '125', icon: Users, description: '+5 since last month' },
    { title: 'Monthly Supply (Hours)', value: '850 hrs', icon: Droplets, description: 'Avg. 6.8 hrs/customer' },
    { title: 'Monthly Revenue', value: '₹10,20,000', icon: CreditCard, description: 'Based on 1200 Rs/hr' },
    { title: 'Outstanding Bills', value: '₹1,50,000', icon: BarChart3, description: 'From 15 customers' },
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
            <p className="text-muted-foreground">Recent activities will be shown here (e.g., new usage logs, payments).</p>
            {/* Placeholder for recent activity list or quick actions */}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
