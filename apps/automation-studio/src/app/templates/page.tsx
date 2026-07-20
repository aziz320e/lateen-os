'use client';

import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchTemplates } from '@/lib/api/client';

export default function TemplatesPage() {
  const { data: templates } = useQuery({ queryKey: ['templates'], queryFn: fetchTemplates });

  return (
    <StudioShell title="Templates">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="text-sm">{t.name}</CardTitle>
              <Badge>{t.category}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <p className="text-xs text-muted-foreground">{t.nodeCount} nodes</p>
              <Button size="sm" variant="outline" disabled>Use Template</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </StudioShell>
  );
}
