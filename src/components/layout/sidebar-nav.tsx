
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

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <nav className="grid items-start gap-1 p-2 group-[.sidebar-main-container]:py-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          
          const linkContent = (
            <>
              <Icon className={cn(
                "h-5 w-5 shrink-0", 
                isActive ? "text-sidebar-active-fg" : "text-sidebar-icon-fg group-hover:text-sidebar-hover-fg"
              )} />
              <span
                className={cn(
                  "sidebar-nav-item-text text-sm",
                  isActive ? "font-semibold text-sidebar-active-fg" : "text-sidebar-fg group-hover:text-sidebar-hover-fg"
                )}
              >
                {item.title}
              </span>
              {item.label && (
                <Badge 
                  variant={isActive ? "default" : "secondary"} 
                  className="sidebar-nav-item-badge ml-auto shrink-0 bg-primary/20 text-primary dark:bg-primary-dark/20 dark:text-primary-dark"
                >
                  {item.label}
                </Badge>
              )}
            </>
          );

          const linkClasses = cn(
            "flex items-center rounded-md px-3 py-2.5 transition-colors duration-150 ease-in-out",
            "hover:bg-sidebar-hover-bg",
            isActive ? "bg-sidebar-active-bg" : "",
            item.disabled && "cursor-not-allowed opacity-60 hover:bg-transparent"
          );

          return (
            <Tooltip key={`${item.href}-${index}`}>
              <TooltipTrigger asChild>
                <Link
                  href={item.disabled ? "#" : item.href}
                  className={linkClasses}
                  aria-disabled={item.disabled}
                  tabIndex={item.disabled ? -1 : undefined}
                >
                  {linkContent}
                </Link>
              </TooltipTrigger>
              {/* Tooltip only shows when sidebar is collapsed (achieved via CSS on parent) */}
              <TooltipContent 
                side="right" 
                align="center" 
                className="ml-2 group-[.sidebar-main-container:hover]:hidden"
                sideOffset={8}
              >
                <p>{item.title}</p>
                {item.label && (
                    <Badge variant="secondary" className="ml-2">{item.label}</Badge>
                  )}
                {/* <TooltipArrow className="fill-popover" /> Removed this line */}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
