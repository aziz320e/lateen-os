'use client';

import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { StudioShell } from '@/components/layout/studio-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchMarketplace } from '@/lib/api/client';

export default function MarketplacePage() {
  const { data: listings } = useQuery({ queryKey: ['marketplace'], queryFn: fetchMarketplace });

  return (
    <StudioShell title="Marketplace">
      <div className="mb-4 flex justify-between">
        <p className="text-sm text-muted-foreground">Publish, install, and clone automations</p>
        <Button disabled>Publish Automation (stub)</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {listings?.map((l) => (
          <Card key={l.id}>
            <CardHeader>
              <CardTitle className="text-sm">{l.name}</CardTitle>
              <p className="text-xs text-muted-foreground">by {l.publisher}</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {l.rating} · {l.installs} installs
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled>Install</Button>
                <Button size="sm" variant="outline" disabled>Clone</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </StudioShell>
  );
}
