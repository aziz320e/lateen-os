'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function ItemDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load this item"
      message={error.message || 'The Inventory engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
