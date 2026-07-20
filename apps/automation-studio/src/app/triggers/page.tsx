'use client';

import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchTriggers } from '@/lib/api/client';

export default function TriggersPage() {
  const { data: triggers } = useQuery({ queryKey: ['triggers'], queryFn: fetchTriggers });

  return (
    <StudioShell title="Trigger Library">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {triggers?.map((t) => (
          <Card key={t.type}>
            <CardHeader><CardTitle className="text-sm">{t.label}</CardTitle></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{t.description}</p></CardContent>
          </Card>
        ))}
      </div>
    </StudioShell>
  );
}
