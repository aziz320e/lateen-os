'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * Rendered when a real runtime call throws — a genuine failure, never a
 * stand-in for "no data yet" (see `EmptyState` for that). Every module's
 * `error.tsx` (a Next.js error boundary, which must be a client component)
 * wraps this with its own `reset()` callback.
 */
export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 py-16 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {message ? <p className="max-w-md text-sm text-muted-foreground">{message}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
