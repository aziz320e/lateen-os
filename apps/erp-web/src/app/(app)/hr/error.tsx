'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function HrError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load HR data"
      message={error.message || 'The HR engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
