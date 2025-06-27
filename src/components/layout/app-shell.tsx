
"use client";

import * as React from 'react';
import { UserNav } from '@/components/layout/user-nav';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { adminNavItems, viewerNavItems } from '@/config/nav-config';
import { useAuth } from '@/contexts/auth-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Droplets, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = user.role === 'admin' ? adminNavItems : viewerNavItems;

  const sidebarHeaderContent = (
     <div className="sidebar-header">
      <Link href={user.role === 'admin' ? '/admin/dashboard' : '/viewer/dashboard'} className="flex items-center gap-2">
        <Droplets className="h-7 w-7 text-sky-500 shrink-0" />
        <span className="sidebar-app-name-text text-2xl font-bold lowercase tracking-tighter text-sky-500">
            aquatrack
        </span>
      </Link>
    </div>
  );

  const sidebarNavContent = (
    <ScrollArea className="flex-1 sidebar-scroll-area" hideScrollbar={true}>
      <SidebarNav
        items={navItems}
        onItemClick={isMobile ? () => setOpenMobile(false) : undefined}
      />
    </ScrollArea>
  );
  
  const desktopSidebarFooter = (
    <div className="sidebar-footer p-2">
        <UserNav />
    </div>
  );

  const mobileSidebarFooter = (
    <div className="mt-auto border-t border-[hsl(var(--sidebar-border-color))] p-2">
      <UserNav />
    </div>
  );


  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="sidebar-main-container group fixed inset-y-0 left-0 z-30 hidden flex-col md:flex">
          {sidebarHeaderContent}
          {sidebarNavContent}
          {desktopSidebarFooter}
        </aside>
      )}

      {/* Main Content Area & Mobile Integration */}
      <div className={cn(
          "flex flex-1 flex-col",
          !isMobile && "md:ml-[var(--sidebar-collapsed-width)]",
          "overflow-x-hidden" 
        )}
      >
        {/* Mobile Header with Sticky Menu Trigger */}
        {isMobile && (
          <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background/90 px-4 backdrop-blur-sm md:hidden">
            <Sheet open={openMobile} onOpenChange={setOpenMobile}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 text-foreground">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className={cn(
                  "flex flex-col p-0 w-[var(--sidebar-expanded-width)] border-r rounded-r-lg",
                  "bg-mobile-sidebar-light dark:bg-mobile-sidebar-dark text-[rgb(var(--sidebar-fg-light-rgb))] dark:text-[rgb(var(--sidebar-fg-dark-rgb))]" 
                )}
              >
                <SheetHeader className="sr-only"> {/* Visually hidden title for accessibility */}
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                {sidebarHeaderContent}
                {sidebarNavContent}
                {mobileSidebarFooter}
              </SheetContent>
            </Sheet>
          </header>
        )}
        
        <main className="main-content-area flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
