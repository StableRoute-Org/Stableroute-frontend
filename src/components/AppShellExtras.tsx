"use client";

import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";

export function AppShellExtras() {
  return (
    <>
      <CommandPalette />
      <KeyboardShortcutsHelp />
    </>
  );
}
