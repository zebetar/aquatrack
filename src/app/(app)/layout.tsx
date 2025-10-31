
"use client";

import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CommandPalette } from '@/components/shared/command-palette';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Droplets } from 'lucide-react';

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Droplets className="h-12 w-12 animate-pulse-subtle text-primary" />
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <CommandPalette open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <AppShell>{children}</AppShell>
    </>
  );
}
