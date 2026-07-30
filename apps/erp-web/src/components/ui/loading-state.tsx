import { cn } from '@/lib/utils';

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

/**
 * Used by every module's `loading.tsx` — Next.js renders this
 * automatically while the module's server-rendered page is awaiting its
 * real runtime query, via React Suspense at the route-segment boundary.
 */
export function LoadingState({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <SkeletonLine className="h-8 w-48" />
      <div className="rounded-lg border border-border">
        <div className="space-y-3 p-4">
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonLine key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
