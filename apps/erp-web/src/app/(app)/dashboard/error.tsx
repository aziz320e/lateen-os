'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load the dashboard"
      message={error.message || 'One or more engine runtimes failed to respond.'}
      onRetry={reset}
    />
  );
}
