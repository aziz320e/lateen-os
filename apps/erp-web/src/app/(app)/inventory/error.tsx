'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load Inventory data"
      message={error.message || 'The Inventory engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
