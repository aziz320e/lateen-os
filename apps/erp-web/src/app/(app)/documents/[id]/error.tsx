'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function DocumentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load this document"
      message={error.message || 'The Document Management engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
