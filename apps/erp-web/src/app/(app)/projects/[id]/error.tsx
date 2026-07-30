'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function ProjectDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load this project"
      message={error.message || 'The Project Management engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
