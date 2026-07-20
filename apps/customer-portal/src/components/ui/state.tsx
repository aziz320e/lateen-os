import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="font-medium">{title}</p>
      {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center text-sm text-destructive">
      {message}
    </div>
  );
}
