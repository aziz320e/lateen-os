'use client';

import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchActions } from '@/lib/api/client';

export default function ActionsPage() {
  const { data: actions } = useQuery({ queryKey: ['actions'], queryFn: fetchActions });

  return (
    <StudioShell title="Action Library">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {actions?.map((a) => (
          <Card key={a.type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">{a.label}</CardTitle>
              <Badge>{a.category}</Badge>
            </CardHeader>
            <CardContent><code className="text-xs text-muted-foreground">{a.type}</code></CardContent>
          </Card>
        ))}
      </div>
    </StudioShell>
  );
}
