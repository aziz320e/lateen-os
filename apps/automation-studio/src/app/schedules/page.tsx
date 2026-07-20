'use client';

import { StudioShell } from '@/components/layout/studio-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SCHEDULES = [
  { id: 's1', name: 'Daily Production', cron: '0 6 * * 1-5', automation: 'Printing Production Workflow' },
  { id: 's2', name: 'Weekly Report', cron: '0 8 * * 1', automation: 'Sales Follow-up' },
  { id: 's3', name: 'Invoice Reminder', cron: '0 9 1 * *', automation: 'Invoice Reminder' },
];

export default function SchedulesPage() {
  return (
    <StudioShell title="Schedules">
      <p className="mb-4 text-sm text-muted-foreground">Cron schedules — execution via Mission Scheduler</p>
      <div className="space-y-3">
        {SCHEDULES.map((s) => (
          <Card key={s.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">{s.name}</CardTitle>
              <Badge>{s.cron}</Badge>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{s.automation}</CardContent>
          </Card>
        ))}
      </div>
    </StudioShell>
  );
}
