'use client';

import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchConnectors } from '@/lib/api/client';

export default function ConnectorsPage() {
  const { data: connectors } = useQuery({ queryKey: ['connectors'], queryFn: fetchConnectors });

  return (
    <StudioShell title="Connector Library">
      <div className="grid gap-3 md:grid-cols-2">
        {connectors?.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm">{c.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{c.category}</p>
              </div>
              <Badge className={c.status === 'connected' ? 'border-green-500/50 text-green-400' : ''}>{c.status}</Badge>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" disabled>{c.status === 'connected' ? 'Configure' : 'Connect'}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </StudioShell>
  );
}
