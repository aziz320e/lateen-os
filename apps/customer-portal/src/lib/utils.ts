import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function formatCurrency(value: string | number | undefined, currency = 'SAR'): string {
  if (value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(num);
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    fulfilled: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    accepted: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    approved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    paid: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    sent: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    pending: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
    confirmed: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    in_progress: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    production: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    rejected: 'bg-red-500/15 text-red-600 dark:text-red-400',
    overdue: 'bg-red-500/15 text-red-600 dark:text-red-400',
    cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400',
  };
  return map[status] ?? 'bg-secondary text-muted-foreground';
}
