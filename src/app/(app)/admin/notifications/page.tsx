
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BellRing, CheckCircle2, Droplets, CreditCard, UserPlus, UserCog, Loader2, Palette } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { 
  getAllAdminNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '@/lib/mock-data-store';
import { format } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const NotificationIcon = ({ type }: { type: Notification['type']}) => {
  switch(type) {
    case 'USAGE_LOGGED': return <Droplets className="h-5 w-5" />;
    case 'PAYMENT_RECORDED': return <CreditCard className="h-5 w-5" />;
    case 'CUSTOMER_ADDED': return <UserPlus className="h-5 w-5" />;
    case 'CUSTOMER_UPDATED': return <UserCog className="h-5 w-5" />;
    case 'BILL_REMINDER': return <BellRing className="h-5 w-5 text-destructive" />;
    case 'ANNOUNCEMENT': return <Palette className="h-5 w-5" />;
    default: return <BellRing className="h-5 w-5" />;
  }
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = useCallback(() => {
    setIsLoading(true);
    try {
      const adminNotifications = getAllAdminNotifications();
      setNotifications(adminNotifications);
    } catch(error) {
      console.error("Failed to load notifications from mock store", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load notifications from mock store. Check console for details." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = (notificationId: string) => {
    try {
      markNotificationAsRead(notificationId, 'admin001');
      fetchNotifications();
    } catch(error) {
      console.error("Failed to mark notification as read:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not mark notification as read." });
    }
  };

  const handleMarkAllAsRead = () => {
    try {
      markAllNotificationsAsRead('admin001');
      fetchNotifications();
      toast({ title: "Success", description: "All notifications marked as read." });
    } catch(error) {
      console.error("Failed to mark all notifications as read:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not mark all notifications as read." });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading notifications...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <Card className="shadow-md glassmorphism-card mt-6">
        <CardHeader>
           <div className="flex justify-between items-center">
            <div>
              <CardTitle>Notification Log</CardTitle>
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
            <p className="text-muted-foreground py-8 text-center">No notifications yet.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh-16rem)] pr-4">
              <ul className="space-y-4">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`flex items-start space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                      !notification.isRead ? 'bg-primary/10 border-primary/50' : 'bg-card/80'
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
                        {format(new Date(notification.createdAt), 'PP p')}
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
