'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchCommands, sendCommand } from '@/lib/api/client';
import type { CommandDefinition } from '@/types';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState<CommandDefinition[]>([]);
  const router = useRouter();

  const load = useCallback(async (q: string) => {
    const data = await fetchCommands(q);
    setCommands(data);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) load(query);
  }, [open, query, load]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-md border bg-background/50 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span>Search commands…</span>
        <kbd className="ml-2 rounded border px-1.5 text-xs">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-[15vh] p-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-lg border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b px-3">
          <Command className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="border-0 focus-visible:ring-0"
          />
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {commands.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-left hover:bg-muted text-sm"
                onClick={async () => {
                  setOpen(false);
                  await sendCommand(c.slash);
                  router.push(`/?cmd=${encodeURIComponent(c.slash)}`);
                }}
              >
                <span className="font-medium">{c.slash}</span>
                <span className="block text-xs text-muted-foreground">{c.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
