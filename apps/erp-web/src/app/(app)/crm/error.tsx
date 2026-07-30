'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function CrmError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load CRM data"
      message={error.message || 'The CRM engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
