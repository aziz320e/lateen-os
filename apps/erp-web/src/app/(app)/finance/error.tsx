'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function FinanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load Finance data"
      message={error.message || 'The Finance engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
