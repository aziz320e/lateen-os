import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: string | number | undefined): string {
  if (value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return String(value);
  return num <= 1 ? `${(num * 100).toFixed(0)}%` : `${num.toFixed(1)}%`;
}

export function formatCurrency(value: string | number | undefined, currency = 'SAR'): string {
  if (value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(num);
}

export function formatDate(value: string | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    ok: 'bg-emerald-500/15 text-emerald-400',
    healthy: 'bg-emerald-500/15 text-emerald-400',
    completed: 'bg-emerald-500/15 text-emerald-400',
    running: 'bg-blue-500/15 text-blue-400',
    active: 'bg-blue-500/15 text-blue-400',
    failed: 'bg-red-500/15 text-red-400',
    down: 'bg-red-500/15 text-red-400',
    critical: 'bg-red-500/15 text-red-400',
    ready: 'bg-emerald-500/15 text-emerald-400',
    submitted: 'bg-amber-500/15 text-amber-400',
    approved: 'bg-emerald-500/15 text-emerald-400',
    rejected: 'bg-red-500/15 text-red-400',
    pending: 'bg-slate-500/15 text-slate-300',
    pending_approval: 'bg-amber-500/15 text-amber-400',
    waiting: 'bg-blue-500/15 text-blue-400',
    escalated: 'bg-amber-500/15 text-amber-400',
    degraded: 'bg-amber-500/15 text-amber-400',
    at_risk: 'bg-amber-500/15 text-amber-400',
    low: 'bg-emerald-500/15 text-emerald-400',
    medium: 'bg-amber-500/15 text-amber-400',
    high: 'bg-red-500/15 text-red-400',
  };
  return map[status] ?? 'bg-secondary text-muted-foreground';
}

export function healthStatusColor(status: string): string {
  return statusColor(status);
}
