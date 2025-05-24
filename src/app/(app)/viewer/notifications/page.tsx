
"use client";

import { PageHeader } from '@/components/shared/page-header';
import type { Notification } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BellRing, CheckCircle2, Droplets, CreditCard, Loader2 } from 'lucide-react'; 
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
// import { getMockNotificationsByUserId } from '@/lib/mock-data-store'; // Assuming this would exist

// Placeholder for mock notifications until a store function is available
const getMyNotifications = async (viewerId: string): Promise<Notification[]> => {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate fetch
  // In a real app, this would fetch from a store: getMockNotificationsByUserId(viewerId)
  return []; // Return empty for now
}


const NotificationIcon = ({ type }: { type: Notification['type']}) => {
  switch(type) {
    case 'USAGE_LOGGED': return <Droplets className="h-5 w-5" />;
    case 'PAYMENT_RECORDED': return <CreditCard className="h-5 w-5" />;
    case 'BILL_REMINDER': return <BellRing className="h-5 w-5 text-destructive" />; // text-destructive might not work as intended if not themed
    case 'ANNOUNCEMENT': return <BellRing className="h-5 w-5" />;
    default: return <BellRing className="h-5 w-5" />;
  }
}

export default function ViewerNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user || !user.id) { // Using user.id as generic userId for notifications
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const fetchedNotifications = await getMyNotifications(user.id); // Use generic user.id
    setNotifications(fetchedNotifications || []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadNotifications();
    }
  }, [authLoading, loadNotifications]);

  // Mock mark as read function
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? {...n, isRead: true} : n)
    );
    // In a real app, you'd also update this in the backend/store
  };
  
  // Mock mark all as read
  const handleMarkAllAsRead = () => {
     setNotifications(prev => prev.map(n => ({...n, isRead: true })));
  };


  if (isLoading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading notifications...</p>
      </div>
    );
  }

  if (!user) {
      return <p>Not authenticated. Please log in.</p>
  }

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
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
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
                      <Button variant="ghost" size="sm" className="text-xs self-start" onClick={() => handleMarkAsRead(notification.id)}>
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
