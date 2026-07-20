import type * as React from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'outline' }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'outline' && 'border-border bg-transparent',
        className,
      )}
      {...props}
    />
  );
}
