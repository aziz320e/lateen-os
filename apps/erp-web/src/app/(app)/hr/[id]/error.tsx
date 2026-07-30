'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function EmployeeDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load this employee"
      message={error.message || 'The HR engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
