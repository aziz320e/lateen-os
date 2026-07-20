'use client';

import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { WorkflowBuilderCanvas } from '@/components/workflow-builder/workflow-builder-canvas';
import { fetchAutomation } from '@/lib/api/client';

export default function WorkflowBuilderPage() {
  const { data: automation } = useQuery({
    queryKey: ['automation', 'auto-sales-followup'],
    queryFn: () => fetchAutomation('auto-sales-followup'),
  });

  return (
    <StudioShell title="Workflow Builder">
      <p className="mb-4 text-sm text-muted-foreground">React Flow canvas with drag & drop, undo/redo, zoom, minimap, groups, subflows, and validation</p>
      {automation && <WorkflowBuilderCanvas automation={automation} />}
    </StudioShell>
  );
}
