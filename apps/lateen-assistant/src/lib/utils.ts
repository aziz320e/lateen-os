import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    running: 'bg-blue-500/15 text-blue-400',
    completed: 'bg-emerald-500/15 text-emerald-400',
    paused: 'bg-amber-500/15 text-amber-400',
    failed: 'bg-red-500/15 text-red-400',
    pending: 'bg-slate-500/15 text-slate-300',
    approved: 'bg-emerald-500/15 text-emerald-400',
    rejected: 'bg-red-500/15 text-red-400',
    active: 'bg-blue-500/15 text-blue-400',
  };
  return map[status] ?? 'bg-secondary text-muted-foreground';
}
