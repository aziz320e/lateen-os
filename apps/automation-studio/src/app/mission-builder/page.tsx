'use client';

import { StudioShell } from '@/components/layout/studio-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MISSION_STEPS = [
  { id: 'm1', label: 'Define Objective', status: 'configured' },
  { id: 'm2', label: 'Assign AI Worker', status: 'configured' },
  { id: 'm3', label: 'Set Success Criteria', status: 'configured' },
  { id: 'm4', label: 'Configure Deadline', status: 'pending' },
  { id: 'm5', label: 'Link Workflow', status: 'pending' },
];

export default function MissionBuilderPage() {
  return (
    <StudioShell title="Mission Builder">
      <p className="mb-4 text-sm text-muted-foreground">Design missions — execution via Mission Scheduler</p>
      <Card>
        <CardHeader>
          <CardTitle>Production Planning Mission</CardTitle>
          <CardDescription>Mission design contract — not executed in Studio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {MISSION_STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-3 rounded-md border p-3">
              <span className="text-xs text-muted-foreground">{i + 1}</span>
              <span className="flex-1">{step.label}</span>
              <Badge className={step.status === 'configured' ? 'border-green-500/50 text-green-400' : ''}>{step.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </StudioShell>
  );
}
