
"use client";

import type { ReactNode } from 'react';
import { UserNav } from '@/components/layout/user-nav';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { adminNavItems, viewerNavItems } from '@/config/nav-config';
import { useAuth } from '@/contexts/auth-context';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Droplets, Loader2 } from 'lucide-react'; // Changed Water to Droplets
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
     // This should ideally be handled by AuthProvider redirecting, but as a fallback:
    return null; // Or a redirect component
  }

  const navItems = user.role === 'admin' ? adminNavItems : viewerNavItems;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4 shrink-0">
        <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
          <Droplets className="h-7 w-7 text-primary" /> {/* Changed Water to Droplets */}
          <span className="text-xl">AquaTrack</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <SidebarNav items={navItems} />
      </ScrollArea>
    </div>
  );


  return (
    <div className="flex min-h-screen w-full">
      {!isMobile && (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border bg-sidebar md:flex">
          {sidebarContent}
        </aside>
      )}

      <div className={`flex flex-1 flex-col ${!isMobile ? 'md:pl-64' : ''}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
                {sidebarContent}
              </SheetContent>
            </Sheet>
          )}
          <div className="flex-1">
            {/* Optional: Breadcrumbs or Page Title can go here */}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
