
"use client";

import type { ReactNode } from 'react';
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
    // This should ideally not happen if AuthProvider handles redirection correctly,
    // but it's a safe fallback.
    return null; 
  }

  const navItems = user.role === 'admin' ? adminNavItems : viewerNavItems;

  const sidebarHeaderContent = (
     <div className="sidebar-header group"> {/* Added group here for app name text hover */}
      <Link href="/" className="flex items-baseline gap-2 text-sidebar-foreground">
        <Droplets className="h-7 w-7 text-primary shrink-0" /> 
        <span className={cn(
          "sidebar-app-name-text gradient-text",
           "group-hover:opacity-100" // Ensure this applies when sidebar (group) is hovered
          )}>
            AquaTrack
        </span>
      </Link>
    </div>
  );
  
  const sidebarFooterContent = (
    <div className={cn(
        "sidebar-footer mt-auto border-t border-sidebar-border-color p-2",
        "opacity-0 transition-opacity duration-200 ease-in-out",
        "group-hover:opacity-100" // Visible when sidebar is hovered
        )}>
        <UserNav />
    </div>
  );


  const sidebarContent = (
    <div className="flex h-full flex-col">
      {sidebarHeaderContent}
      <ScrollArea className="flex-1 sidebar-scroll-area" thumbClassName="sidebar-scroll-area-thumb">
        <SidebarNav items={navItems} />
      </ScrollArea>
       {/* UserNav at the bottom of the desktop sidebar, visible on hover */}
       {sidebarFooterContent}
    </div>
  );
  
  const mobileSidebarContent = (
    <div className="flex h-full flex-col">
      {sidebarHeaderContent}
      <ScrollArea className="flex-1 sidebar-scroll-area" thumbClassName="sidebar-scroll-area-thumb">
        <SidebarNav items={navItems} />
      </ScrollArea>
       {/* UserNav at the bottom of the mobile sidebar, always visible when sheet is open */}
      <div className="mt-auto border-t border-sidebar-border-color p-2">
        <UserNav />
      </div>
    </div>
  );


  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="sidebar-main-container group fixed inset-y-0 left-0 z-40 hidden flex-col md:flex">
          {sidebarContent}
        </aside>
      )}

      {/* Main Content Area */}
      <div className={cn(
          "flex flex-1 flex-col",
          !isMobile && "md:ml-[var(--sidebar-collapsed-width)] transition-[margin-left] duration-300 ease-in-out group-hover:md:ml-[var(--sidebar-expanded-width)]", // Adjust margin based on sidebar state
          "overflow-x-hidden" // Crucial to prevent content from causing full page scroll
        )}
      >
        {/* Mobile Menu Trigger & Desktop UserNav (Top Right) */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:justify-end">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 text-foreground">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className={cn(
                  "flex flex-col p-0 w-[var(--sidebar-expanded-width)] border-r border-sidebar-border-color",
                  "bg-mobile-sidebar-light dark:bg-mobile-sidebar-dark text-sidebar-fg"
                )}
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                {mobileSidebarContent}
              </SheetContent>
            </Sheet>
          )}
          {!isMobile && <UserNav />} {/* Desktop UserNav fixed to header */}
        </div>
        
        <main className="main-content-area flex-1 p-4 sm:p-6"> {/* Removed pt-16/pt-20, handled by sticky header */}
          {children}
        </main>
      </div>
       {isMobile && ( /* UserNav for mobile, fixed bottom right for example - or keep in sheet */
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
          <UserNav />
        </div>
      )}
    </div>
  );
}
