'use client';

import { CommandPalette } from '@/components/CommandPalette';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { ThemeShortcut } from '@/components/ThemeShortcut';

export function AppShellExtras() {
  return (
    <>
      <ThemeShortcut />
      <CommandPalette />
      <KeyboardShortcutsHelp />
    </>
  );
}
