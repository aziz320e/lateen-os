'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { fetchNotifications } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications, refetchInterval: 60_000 });
  const unread = data?.notifications.filter((n) => !n.read).length ?? 0;

  return (
    <div className="relative">
      <Bell className="h-5 w-5 text-muted-foreground" />
      {unread > 0 ? (
        <Badge className={cn('absolute -top-2 -right-2 h-5 min-w-5 px-1 text-xs bg-primary text-primary-foreground')}>
          {unread}
        </Badge>
      ) : null}
    </div>
  );
}
