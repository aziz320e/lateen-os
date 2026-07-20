'use client';

import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchTemplates } from '@/lib/api/client';

export default function TemplatesPage() {
  const { data: templates } = useQuery({ queryKey: ['templates'], queryFn: fetchTemplates });

  return (
    <StudioShell title="Templates">
      <div className="grid gap-3 md:grid-cols-3">
        {templates?.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle>{t.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{t.category}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <Button size="sm" variant="outline" disabled>Use Template</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </StudioShell>
  );
}
