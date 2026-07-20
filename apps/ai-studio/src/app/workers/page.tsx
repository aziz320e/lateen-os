'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchWorkers } from '@/lib/api/client';

export default function WorkersPage() {
  const { data: workers, isLoading } = useQuery({ queryKey: ['workers'], queryFn: fetchWorkers });

  return (
    <StudioShell title="Workers">
      <div className="mb-4 flex justify-between">
        <p className="text-sm text-muted-foreground">Design worker configurations — lifecycle managed by AI Workforce</p>
        <Button disabled>New Worker (stub)</Button>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-3">
          {workers?.map((w) => (
            <Card key={w.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{w.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{w.role} · {w.goal}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{w.status}</Badge>
                  <Badge>v{w.version}</Badge>
                  <Button size="sm" asChild><Link href={`/workers/${w.id}`}>Design</Link></Button>
                </div>
              </CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{w.description}</p></CardContent>
            </Card>
          ))}
        </div>
      )}
    </StudioShell>
  );
}
