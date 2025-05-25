
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
    return null;
  }

  const navItems = user.role === 'admin' ? adminNavItems : viewerNavItems;

  const sidebarHeaderContent = (
     <div className="sidebar-header"> {/* group was for gradient-text, not strictly needed now but harmless */}
      <Link href="/" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-hover-fg">
        <Droplets className="h-7 w-7 text-primary shrink-0" />
        <span className={cn(
          "sidebar-app-name-text font-bold text-xl", // Removed gradient-text, added font-bold and text-xl for consistent styling
          "group-[.sidebar-main-container]:group-hover:opacity-100" // Opacity handled by parent group hover
          )}>
            AquaTrack
        </span>
      </Link>
    </div>
  );

  const sidebarDesktopFooterContent = (
    <div className={cn(
        "sidebar-footer",
        "group-[.sidebar-main-container]:group-hover:opacity-100" // Visible when desktop sidebar is hovered
        )}>
        <UserNav />
    </div>
  );
  
  const sidebarMobileFooterContent = (
    <div className="mt-auto border-t border-sidebar-border-color p-2"> {/* Always visible in mobile sheet */}
      <UserNav />
    </div>
  );

  const sidebarNavContent = (
    <ScrollArea className="flex-1 sidebar-scroll-area" thumbClassName="sidebar-scroll-area-thumb">
      <SidebarNav items={navItems} />
    </ScrollArea>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="sidebar-main-container group fixed inset-y-0 left-0 z-40 hidden flex-col md:flex">
          {sidebarHeaderContent}
          {sidebarNavContent}
          {sidebarDesktopFooterContent}
        </aside>
      )}

      {/* Main Content Area & Mobile Integration */}
      <div className={cn(
          "flex flex-1 flex-col",
          !isMobile && "md:ml-[var(--sidebar-collapsed-width)]",
          "overflow-x-hidden" // Crucial to prevent content from causing full page scroll
        )}
      >
        {/* Top bar for mobile menu trigger and desktop UserNav */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:justify-end">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 text-foreground md:hidden">
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
                {/* Visually hidden title for accessibility for the Sheet (Dialog) */}
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                {sidebarHeaderContent}
                {sidebarNavContent}
                {sidebarMobileFooterContent}
              </SheetContent>
            </Sheet>
          )}
          {!isMobile && (
            <div className="fixed top-4 right-4 z-50">
              <UserNav />
            </div>
          )}
        </div>

        <main className="main-content-area flex-1 p-4 pt-6 sm:p-6 sm:pt-8 md:pt-6">
          {children}
        </main>
      </div>
       {isMobile && ( /* UserNav for mobile, fixed bottom right for example */
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
          <UserNav />
        </div>
      )}
    </div>
  );
}
