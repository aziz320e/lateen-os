'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/portal-shell';
import { Badge } from '@/components/ui/badge';
import { Skeleton, EmptyState } from '@/components/ui/state';
import { fetchNotifications } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';

export default function NotificationsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });

  return (
    <div>
      <PageHeader title="Notifications" description="Project, production, quotation, and delivery updates" />
      <div className="p-6 md:p-8 space-y-3">
        {isLoading ? <Skeleton className="h-64" /> : !data?.notifications.length ? (
          <EmptyState title="No notifications" />
        ) : (
          data.notifications.map((n) => (
            <div key={n.id} className="rounded-lg border p-4 flex justify-between gap-4">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(n.timestamp)}</p>
              </div>
              <Badge variant="outline">{n.type}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
