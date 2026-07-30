'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function CustomerSuccessDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load this record"
      message={error.message || 'The Customer Success engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
