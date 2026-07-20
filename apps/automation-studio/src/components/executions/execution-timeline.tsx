'use client';

import type { ExecutionRecord } from '@/lib/types/automation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_COLORS: Record<string, string> = {
  completed: 'border-green-500/50 text-green-400',
  failed: 'border-red-500/50 text-red-400',
  running: 'border-blue-500/50 text-blue-400',
  pending: 'border-muted text-muted-foreground',
  retrying: 'border-yellow-500/50 text-yellow-400',
  skipped: 'opacity-50',
};

export function ExecutionTimeline({ execution }: { execution: ExecutionRecord }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <div><span className="text-muted-foreground">Status:</span> <Badge className={STATUS_COLORS[execution.status]}>{execution.status}</Badge></div>
        <div><span className="text-muted-foreground">Duration:</span> {execution.durationMs ? `${(execution.durationMs / 1000).toFixed(1)}s` : '—'}</div>
        <div><span className="text-muted-foreground">Started:</span> {new Date(execution.startedAt).toLocaleString()}</div>
      </div>

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {execution.steps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-3 border-l-2 border-primary/30 pl-4">
              <div className="text-xs text-muted-foreground">{i + 1}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{step.label}</span>
                  <Badge className={STATUS_COLORS[step.status]}>{step.status}</Badge>
                  {step.retries > 0 && <Badge>retries: {step.retries}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {step.durationMs ? `${step.durationMs}ms` : ''}
                  {step.error && <span className="text-red-400"> · {step.error}</span>}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {execution.decisionTrace.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Decision Trace</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {execution.decisionTrace.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {execution.workerTrace.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Worker Trace</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {execution.workerTrace.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
