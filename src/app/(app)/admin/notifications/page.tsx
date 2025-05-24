
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types'; // Assuming Notification type exists

// Placeholder data - now an empty array
const mockNotifications: Notification[] = [];


export default function AdminNotificationsPage() {
  // In a real app, you'd fetch notifications and handle marking as read
  const notifications = mockNotifications;

  return (
    <>
      <PageHeader title="Admin Notifications" description="Log of sent notifications and system alerts." />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Notification Log</CardTitle>
          <CardDescription>Recent system-generated notifications and alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">No notifications yet.</p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <ul className="space-y-3">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`flex items-start space-x-3 rounded-md border p-3 ${
                      !notification.isRead ? 'bg-accent/50 border-primary/50' : 'bg-card'
                    }`}
                  >
                    <div className={`mt-1 shrink-0 ${!notification.isRead ? 'text-primary' : 'text-muted-foreground'}`}>
                      {notification.type === 'PAYMENT_RECORDED' && <CheckCircle2 className="h-5 w-5" />}
                      {notification.type === 'USAGE_LOGGED' && <BellRing className="h-5 w-5" />}
                      {notification.type === 'ANNOUNCEMENT' && <BellRing className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <Button variant="ghost" size="sm" className="text-xs">
                        Mark as read
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
