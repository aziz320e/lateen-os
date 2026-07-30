'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Couldn't load Projects data"
      message={error.message || 'The Project Management engine runtime failed to respond.'}
      onRetry={reset}
    />
  );
}
