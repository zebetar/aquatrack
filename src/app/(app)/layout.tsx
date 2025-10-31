
"use client";

import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CommandPalette } from '@/components/shared/command-palette';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Droplets } from 'lucide-react';

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const onOpen = () => setCommandPaletteOpen(true);
    window.addEventListener('open-command-palette', onOpen);
    return () => window.removeEventListener('open-command-palette', onOpen);
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Droplets className="h-12 w-12 animate-pulse-subtle text-primary" />
      </div>
    );
  }

  // To prevent flash of content before redirect
  if (!user) {
    return (
       <div className="flex h-screen items-center justify-center">
        <Droplets className="h-12 w-12 animate-pulse-subtle text-primary" />
      </div>
    );
  }
  
  return (
    <>
      <CommandPalette open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <AppShell>{children}</AppShell>
    </>
  );
}
