'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function OpportunityDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load this opportunity"
      message={error.message || 'The Sales engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
