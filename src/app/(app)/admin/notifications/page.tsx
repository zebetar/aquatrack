
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BellRing, CheckCircle2, Droplets, CreditCard, UserPlus, UserCog, Palette, AlertTriangle } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const NotificationIcon = ({ type }: { type: Notification['type']}) => {
  const iconProps = { className: "h-5 w-5" };
  switch(type) {
    case 'USAGE_LOGGED': return <Droplets {...iconProps} />;
    case 'PAYMENT_RECORDED': return <CreditCard {...iconProps} />;
    case 'CUSTOMER_ADDED': return <UserPlus {...iconProps} />;
    case 'CUSTOMER_UPDATED': return <UserCog {...iconProps} />;
    case 'BILL_REMINDER': return <BellRing {...iconProps} />;
    case 'ANNOUNCEMENT': return <Palette {...iconProps} />;
    case 'ISSUE_REPORTED': return <AlertTriangle {...iconProps} />;
    default: return <BellRing {...iconProps} />;
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
      toast({ variant: "destructive", title: "Error", description: "Could not load notifications. Check console for details." });
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
      <div className="flex h-full items-center justify-center mt-6">
        <Droplets className="h-8 w-8 animate-pulse-subtle text-primary" />
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
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No notifications yet.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <ul className="divide-y divide-border">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={cn(
                        "flex items-start space-x-4 p-4 transition-colors",
                        !notification.isRead ? 'bg-primary/5' : 'hover:bg-muted/50',
                         notification.type === 'ISSUE_REPORTED' && !notification.isRead && 'bg-amber-500/10'
                    )}
                  >
                    <div className={cn(
                        "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        !notification.isRead ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                        notification.type === 'ISSUE_REPORTED' && !notification.isRead && 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
                        notification.type === 'ISSUE_REPORTED' && notification.isRead && 'text-amber-500'
                    )}>
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1">
                      <p className={cn(
                          "text-sm",
                          !notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'
                      )}>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 self-center" onClick={() => handleMarkAsRead(notification.id)} title="Mark as read">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground"/>
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
