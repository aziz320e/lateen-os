'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboard } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';

export default function AuditPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading || !data) {
    return <div><Header title="Audit Center" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  const auditEvents = [
    ...data.missions.flatMap((m) =>
      m.events.map((e) => ({
        id: `${m.id}-${e.eventName}-${e.occurredAt}`,
        source: 'Mission',
        action: e.eventName,
        detail: m.title,
        timestamp: e.occurredAt,
      })),
    ),
    ...data.decisions.map((d) => ({
      id: `decision-${d.id}`,
      source: 'Decision Engine',
      action: d.status,
      detail: d.title,
      timestamp: d.updatedAt,
    })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div>
      <Header title="Audit Center" description="Enterprise audit trail from missions, decisions, and platform events" />
      <div className="p-8">
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Detail</th>
                <th className="px-4 py-3 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.slice(0, 50).map((event) => (
                <tr key={event.id} className="border-t">
                  <td className="px-4 py-3">{event.source}</td>
                  <td className="px-4 py-3 font-mono text-xs">{event.action}</td>
                  <td className="px-4 py-3">{event.detail}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(event.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {auditEvents.length === 0 ? <p className="p-8 text-center text-muted-foreground">No audit events</p> : null}
        </div>
      </div>
    </div>
  );
}
