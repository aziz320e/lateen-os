'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function SalesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load Sales data"
      message={error.message || 'The Sales engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
