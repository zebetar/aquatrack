
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, File, Command as CommandIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { adminNavItems, viewerNavItems } from '@/config/nav-config';
import type { Customer, CommandItem } from '@/types';
import { getAllMockCustomers } from '@/lib/mock-data-store';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const navItems = user.role === 'admin' ? adminNavItems : viewerNavItems;
      const customers = user.role === 'admin' ? getAllMockCustomers() : [];

      const pageCommands: CommandItem[] = navItems.map(item => ({
        id: `page-${item.href}`,
        type: 'page',
        title: item.title,
        icon: item.icon,
        href: item.href,
      }));

      const customerCommands: CommandItem[] = customers.map((c: Customer) => ({
        id: `customer-${c.id}`,
        type: 'customer',
        title: c.name,
        description: c.email || 'No email',
        icon: User,
        href: `/admin/customers/${c.id}`,
      }));
      
      const actionCommands: CommandItem[] = [
        {
            id: 'action-logout',
            type: 'action',
            title: 'Logout',
            icon: LogOut,
            action: () => {
                logout();
                onOpenChange(false);
            }
        }
      ]

      setCommands([...pageCommands, ...customerCommands, ...actionCommands]);
    }
  }, [user, open]); // Re-calculate commands when user changes or palette opens

  const filteredCommands = search
    ? commands.filter(cmd =>
        cmd.title.toLowerCase().includes(search.toLowerCase()) ||
        (cmd.description && cmd.description.toLowerCase().includes(search.toLowerCase()))
      )
    : commands;

  const handleSelect = (command: CommandItem) => {
    if (command.href) {
      router.push(command.href);
    }
    if (command.action) {
      command.action();
    }
    onOpenChange(false);
    setSearch('');
  };

  const getGroupedCommands = () => {
    const groups: { [key: string]: CommandItem[] } = {
      pages: [],
      customers: [],
      actions: [],
    };
    filteredCommands.forEach(cmd => {
      if (cmd.type === 'page') groups.pages.push(cmd);
      else if (cmd.type === 'customer') groups.customers.push(cmd);
      else if (cmd.type === 'action') groups.actions.push(cmd);
    });
    return groups;
  };
  
  const grouped = getGroupedCommands();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b px-4">
          <Search className="h-5 w-5 mr-2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="h-12 w-full border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
        <ScrollArea className="h-[400px]">
          {Object.entries(grouped).map(([groupName, commands]) => (
            commands.length > 0 && (
              <div key={groupName} className="py-2">
                <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground">{groupName.charAt(0).toUpperCase() + groupName.slice(1)}</p>
                <div className="space-y-1">
                  {commands.map(cmd => (
                    <div
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      className="flex items-center gap-3 px-4 py-2 mx-2 rounded-md text-sm hover:bg-accent cursor-pointer transition-colors"
                    >
                      <cmd.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span>{cmd.title}</span>
                        {cmd.description && <p className="text-xs text-muted-foreground">{cmd.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
          {filteredCommands.length === 0 && search && (
             <div className="p-4 text-center text-sm text-muted-foreground">No results found.</div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
