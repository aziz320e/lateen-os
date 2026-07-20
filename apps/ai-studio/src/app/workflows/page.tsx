'use client';

import { StudioShell } from '@/components/layout/studio-shell';
import { WorkflowCanvas } from '@/components/workflows/workflow-canvas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkflowsPage() {
  return (
    <StudioShell title="Workflows">
      <Card>
        <CardHeader>
          <CardTitle>Worker Workflow Designer</CardTitle>
          <CardDescription>Visual design only — execution via Workflow Engine and AI Runtime</CardDescription>
        </CardHeader>
        <CardContent><WorkflowCanvas /></CardContent>
      </Card>
    </StudioShell>
  );
}
