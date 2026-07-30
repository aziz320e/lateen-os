'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function DocumentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load Documents data"
      message={error.message || 'The Document Management engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
