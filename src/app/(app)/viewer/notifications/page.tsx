"use client";

import type { Notification as TNotification } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BellRing, CheckCircle2, Droplets, CreditCard, UserCog, Palette, AlertTriangle } from 'lucide-react'; 
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase-config';
import { collection, query, where, orderBy, getDocs, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const NotificationIcon = ({ type }: { type: TNotification['type']}) => {
  const iconProps = { className: "h-5 w-5" };
  switch(type) {
    case 'USAGE_LOGGED': return <Droplets {...iconProps} />;
    case 'PAYMENT_RECORDED': return <CreditCard {...iconProps} />;
    case 'CUSTOMER_UPDATED': return <UserCog {...iconProps} />;
    case 'BILL_REMINDER': return <BellRing {...iconProps} />;
    case 'ANNOUNCEMENT': return <Palette {...iconProps} />;
    case 'ISSUE_REPORTED': return <AlertTriangle {...iconProps} />;
    default: return <BellRing {...iconProps} />;
  }
};

export default function ViewerNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<TNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const viewerUserId = user?.id; 

  const loadNotifications = useCallback(async () => {
    if (!viewerUserId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", viewerUserId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedNotifications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate(),
        } as TNotification;
      });
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch notifications.' });
    } finally {
      setIsLoading(false);
    }
  }, [viewerUserId, toast]);

  useEffect(() => {
    if (!authLoading && viewerUserId) {
      loadNotifications();
    } else if (!authLoading && !viewerUserId) {
        setIsLoading(false); 
    }
  }, [authLoading, loadNotifications, viewerUserId]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!viewerUserId) return;
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await writeBatch(db).update(notifRef, { isRead: true }).commit();
      loadNotifications(); 
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update notification.' });
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!viewerUserId) return;
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        const notifRef = doc(db, 'notifications', n.id);
        batch.update(notifRef, { isRead: true });
      });
      await batch.commit();
      toast({ title: "Success", description: "All notifications marked as read." });
      loadNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update all notifications.' });
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center mt-6">
        <Droplets className="h-8 w-8 animate-pulse-subtle text-primary" />
        <p className="ml-2">Loading notifications...</p>
      </div>
    );
  }

  if (!user) {
      return <p>Not authenticated. Please log in.</p>
  }
  if (!viewerUserId) { 
      return <p>Could not identify user for notifications.</p>
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Card className="shadow-md glassmorphism-card mt-6">
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
      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">You have no notifications yet.</p>
        ) : (
          <ScrollArea className="h-[calc(100vh-14rem)]">
            <ul className="divide-y divide-border">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                        "flex items-start space-x-4 p-4 transition-colors",
                        !notification.isRead ? 'bg-primary/5' : 'hover:bg-muted/50'
                    )}
                >
                  <div className={cn(
                      "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      !notification.isRead ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
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
  );
}
