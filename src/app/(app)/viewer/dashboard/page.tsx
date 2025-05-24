import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const SummaryCard = ({ title, value, icon: Icon, actionLink, actionLabel }: { title: string, value: string, icon: React.ElementType, actionLink?: string, actionLabel?: string }) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {actionLink && actionLabel && (
        <Button variant="link" asChild className="px-0 pt-2 text-primary">
          <Link href={actionLink}>{actionLabel}</Link>
        </Button>
      )}
    </CardContent>
  </Card>
);

export default function ViewerDashboardPage() {
  // Placeholder data
  const summaries = [
    { title: 'Current Outstanding Bill', value: 'PKR 2,400', icon: FileText, actionLink: '/viewer/billing', actionLabel: 'View Details' },
    { title: 'Recent Usage (Last 7 Days)', value: '5 hrs', icon: Clock, actionLink: '/viewer/usage', actionLabel: 'View History' },
    { title: 'Last Payment Made', value: 'PKR 1,800 on 15th Jul', icon: DollarSign, actionLink: '/viewer/billing', actionLabel: 'View Payments' },
  ];

  return (
    <>
      <PageHeader title="My Dashboard" description="Your water usage and billing summary." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaries.map(summary => (
          <SummaryCard key={summary.title} {...summary} />
        ))}
      </div>
      <div className="mt-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your recent notifications will appear here.</p>
            <Button variant="default" asChild className="mt-4">
              <Link href="/viewer/notifications">View All Notifications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
