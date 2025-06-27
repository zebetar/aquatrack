
"use client";

import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CommandPalette } from '@/components/shared/command-palette';
import { useState, useEffect } from 'react';

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

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

  return (
    <>
      <CommandPalette open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <AppShell>{children}</AppShell>
    </>
  );
}
