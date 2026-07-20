'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { CenterShell } from '@/components/layout/center-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createExport, fetchExports } from '@/lib/api/client';

const FORMATS = ['pdf', 'excel', 'csv', 'json'] as const;

export default function ExportsPage() {
  const { data: exports, refetch } = useQuery({ queryKey: ['exports'], queryFn: () => fetchExports() });
  const [loading, setLoading] = useState(false);

  async function handleExport(format: string) {
    setLoading(true);
    try {
      await createExport(format, 'ceo');
      await refetch();
    } finally {
      setLoading(false);
    }
  }

  return (
    <CenterShell title="Exports">
      <Card className="mb-4">
        <CardHeader><CardTitle>Export Dashboard</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <Button key={f} size="sm" variant="outline" onClick={() => handleExport(f)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : f.toUpperCase()}
            </Button>
          ))}
        </CardContent>
      </Card>
      <div className="space-y-2">
        {exports?.map((e) => (
          <Card key={e.id}>
            <CardContent className="flex items-center justify-between pt-4 text-sm">
              <span>{e.format.toUpperCase()} · {e.dashboardId ?? 'all'}</span>
              <div className="flex items-center gap-2">
                <Badge>{e.status}</Badge>
                {e.downloadUrl && <span className="text-xs text-muted-foreground">{e.downloadUrl}</span>}
              </div>
            </CardContent>
          </Card>
        )) ?? <p className="text-muted-foreground">No exports yet</p>}
      </div>
    </CenterShell>
  );
}
