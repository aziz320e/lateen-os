'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function CustomerDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load this customer"
      message={error.message || 'The CRM engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
