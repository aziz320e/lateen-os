'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function CustomerSuccessError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load Customer Success data"
      message={error.message || 'The Customer Success engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
