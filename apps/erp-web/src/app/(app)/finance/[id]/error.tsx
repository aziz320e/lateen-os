'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function InvoiceDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load this invoice"
      message={error.message || 'The Finance engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
