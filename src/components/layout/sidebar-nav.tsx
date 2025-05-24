"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar"; // Assuming this exists or we'll use simple state

interface SidebarNavProps {
  items: NavItem[];
  isCollapsed?: boolean; // To handle icon-only view
}

export function SidebarNav({ items, isCollapsed }: SidebarNavProps) {
  const pathname = usePathname();
  // const { state } = useSidebar(); // if using full shadcn sidebar
  // const isCollapsed = state === "collapsed";

  if (!items?.length) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="grid items-start gap-1 px-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          
          const linkContent = (
            <>
              <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground")} />
              <span
                className={cn(
                  "truncate transition-all duration-200",
                  isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto ml-2",
                  isActive ? "font-semibold" : ""
                )}
              >
                {item.title}
              </span>
              {item.label && !isCollapsed && (
                <Badge variant={isActive ? "default" : "secondary"} className="ml-auto">
                  {item.label}
                </Badge>
              )}
            </>
          );

          const linkClasses = cn(
            "flex items-center rounded-md px-3 py-2.5 text-sm transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80",
            isCollapsed ? "justify-center" : ""
          );

          if (isCollapsed) {
            return (
              <Tooltip key={`${item.href}-${index}`}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.disabled ? "#" : item.href}
                    className={cn(linkClasses, item.disabled && "cursor-not-allowed opacity-50")}
                    aria-disabled={item.disabled}
                    tabIndex={item.disabled ? -1 : undefined}
                  >
                    {linkContent}
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-4">
                  {item.title}
                  {item.label && (
                    <Badge variant="secondary">{item.label}</Badge>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.disabled ? "#" : item.href}
              className={cn(linkClasses, item.disabled && "cursor-not-allowed opacity-50")}
              aria-disabled={item.disabled}
              tabIndex={item.disabled ? -1 : undefined}
            >
              {linkContent}
            </Link>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
