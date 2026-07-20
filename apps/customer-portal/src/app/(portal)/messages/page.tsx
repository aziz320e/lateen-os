'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/portal-shell';
import { Badge } from '@/components/ui/badge';
import { Skeleton, EmptyState } from '@/components/ui/state';
import { fetchMessages } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';

export default function MessagesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['messages'], queryFn: fetchMessages });

  return (
    <div>
      <PageHeader title="Messages" description="Project discussions and notifications" />
      <div className="p-6 md:p-8 space-y-3">
        {isLoading ? <Skeleton className="h-64" /> : !data?.messages.length ? (
          <EmptyState title="No messages" />
        ) : (
          data.messages.map((m) => (
            <div key={m.id} className={`rounded-lg border p-4 ${m.unread ? 'border-primary/40 bg-primary/5' : ''}`}>
              <div className="flex justify-between">
                <p className="font-medium">{m.subject}</p>
                {m.unread ? <Badge>New</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{m.preview}</p>
              <p className="text-xs text-muted-foreground mt-2">{formatDate(m.timestamp)} · {m.attachments} attachments</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
