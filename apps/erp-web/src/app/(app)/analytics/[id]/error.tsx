'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function DashboardDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load this dashboard"
      message={error.message || 'The Analytics engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
