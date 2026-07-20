'use client';

import { StudioShell } from '@/components/layout/studio-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DECISION_RULES = [
  { id: 'd1', condition: 'amount > 10000', action: 'Require manager approval', policy: 'human-in-loop' },
  { id: 'd2', condition: 'amount <= 10000', action: 'Auto approve', policy: 'auto' },
  { id: 'd3', condition: 'riskScore > 0.8', action: 'Escalate to Decision Engine', policy: 'decision-engine' },
];

export default function DecisionBuilderPage() {
  return (
    <StudioShell title="Decision Builder">
      <p className="mb-4 text-sm text-muted-foreground">Design decision rules — approval via Decision Engine</p>
      <Card>
        <CardHeader>
          <CardTitle>Procurement Decision Rules</CardTitle>
          <CardDescription>Decision policy contracts — not executed in Studio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DECISION_RULES.map((rule) => (
            <div key={rule.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <code className="text-sm">{rule.condition}</code>
                <Badge>{rule.policy}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{rule.action}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </StudioShell>
  );
}
