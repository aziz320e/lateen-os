'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { StudioShell } from '@/components/layout/studio-shell';
import { WorkflowBuilderCanvas } from '@/components/workflow-builder/workflow-builder-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchAutomation } from '@/lib/api/client';

export default function AutomationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: automation, isLoading, error } = useQuery({ queryKey: ['automation', id], queryFn: () => fetchAutomation(id) });

  return (
    <StudioShell title="Automation Designer">
      <Button variant="ghost" size="sm" className="mb-4" asChild><Link href="/automations">← Back to Automations</Link></Button>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-red-400">Automation not found</p>}
      {automation && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{automation.name}</h2>
            <Badge>{automation.status}</Badge>
            <Badge>v{automation.version}</Badge>
          </div>
          <WorkflowBuilderCanvas automation={automation} />
        </div>
      )}
    </StudioShell>
  );
}
