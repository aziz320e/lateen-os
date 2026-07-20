'use client';

import { StudioShell } from '@/components/layout/studio-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const VARS = [
  { key: 'quotationId', type: 'string', scope: 'automation' },
  { key: 'customerId', type: 'string', scope: 'automation' },
  { key: 'orderId', type: 'string', scope: 'global' },
  { key: 'amount', type: 'number', scope: 'step' },
  { key: 'organizationId', type: 'string', scope: 'global' },
];

export default function VariablesPage() {
  return (
    <StudioShell title="Variables">
      <Card>
        <CardHeader><CardTitle>Automation Variables</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {VARS.map((v) => (
            <div key={v.key} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <code>{`{{${v.key}}}`}</code>
              <div className="flex gap-2">
                <Badge>{v.type}</Badge>
                <Badge>{v.scope}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </StudioShell>
  );
}
