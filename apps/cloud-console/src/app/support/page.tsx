'use client';

import { useQuery } from '@tanstack/react-query';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchSupport } from '@/lib/api/client';

export default function SupportPage() {
  const { data: tickets } = useQuery({ queryKey: ['support'], queryFn: fetchSupport });

  return (
    <ConsoleShell title="Support">
      <div className="space-y-3">
        {tickets?.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between pt-4">
              <div>
                <div className="font-medium">{t.subject}</div>
                <div className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <Badge>{t.priority}</Badge>
                <Badge>{t.status}</Badge>
              </div>
            </CardContent>
          </Card>
        )) ?? <p className="text-muted-foreground">No tickets</p>}
      </div>
    </ConsoleShell>
  );
}
