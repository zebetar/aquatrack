
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { LogOut, User as UserIcon, Settings, Search } from "lucide-react";
import Link from "next/link";

export function UserNav() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const avatarSrc = user.avatarUrl; 
  const isDataUri = avatarSrc && avatarSrc.startsWith('data:image');
  const aiHint = isDataUri ? "profile picture" : (avatarSrc ? "custom avatar" : "avatar person");

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary">
            {avatarSrc ? (
              <AvatarImage src={avatarSrc} alt={user.name || "User"} data-ai-hint={aiHint} />
            ) : (
               <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || user.email}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email} ({user.role})
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openCommandPalette}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search...</span>
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={user.role === 'admin' ? "/admin/settings" : "/viewer/profile"}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>{user.role === 'admin' ? 'Account' : 'Profile'}</span>
            </Link>
          </DropdownMenuItem>
          {user.role === 'admin' && (
             <DropdownMenuItem asChild>
               <Link href="/admin/settings">
                 <Settings className="mr-2 h-4 w-4" />
                 <span>Settings</span>
               </Link>
             </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
