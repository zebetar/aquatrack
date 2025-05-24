
import { PageHeader } from '@/components/shared/page-header';
import type { Notification } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BellRing, CheckCircle2, Droplets, CreditCard } from 'lucide-react'; 
import Link from 'next/link';

// Placeholder data fetching function - now returns empty array
async function getMyNotifications(viewerId: string): Promise<Notification[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return [];
}

const NotificationIcon = ({ type }: { type: Notification['type']}) => {
  switch(type) {
    case 'USAGE_LOGGED': return <Droplets className="h-5 w-5" />;
    case 'PAYMENT_RECORDED': return <CreditCard className="h-5 w-5" />;
    case 'BILL_REMINDER': return <BellRing className="h-5 w-5 text-destructive" />;
    case 'ANNOUNCEMENT': return <BellRing className="h-5 w-5" />;
    default: return <BellRing className="h-5 w-5" />;
  }
}

export default async function ViewerNotificationsPage() {
  // In a real app, get viewerId from auth context
  const viewerId = 'viewer001'; // This would come from auth context
  const notifications = await getMyNotifications(viewerId);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <PageHeader title="My Notifications" description="Updates on your account, usage, and billing." />
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                You have {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}.
              </CardDescription>
            </div>
            {/* No need for 'Mark all as read' if no notifications or unread */}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">You have no notifications yet.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh-20rem)] pr-4"> {/* Adjust height as needed */}
              <ul className="space-y-4">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`flex items-start space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                      !notification.isRead ? 'bg-accent/50 border-primary/50' : 'bg-card'
                    }`}
                  >
                    <div className={`mt-1 shrink-0 p-2 rounded-full ${!notification.isRead ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      {notification.linkTo && (
                         <Button variant="link" size="sm" asChild className="px-0 h-auto mt-1 text-primary">
                           <Link href={notification.linkTo}>View Details</Link>
                         </Button>
                      )}
                    </div>
                    {!notification.isRead && (
                      <Button variant="ghost" size="sm" className="text-xs self-start">
                        <CheckCircle2 className="mr-1 h-3 w-3"/> Mark read
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
}
