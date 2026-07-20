import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function displayName(entity: Record<string, unknown>): string {
  return String(entity.name ?? entity.title ?? entity.code ?? entity.id ?? '—');
}

export function displayStatus(entity: Record<string, unknown>): string | undefined {
  const status = entity.status;
  return typeof status === 'string' ? status : undefined;
}
