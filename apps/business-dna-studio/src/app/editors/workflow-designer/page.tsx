'use client';

import type { Edge, Node } from '@xyflow/react';
import { useMemo, useState } from 'react';
import { FlowCanvas } from '@/components/editors/flow-canvas';
import { PageHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Workflow designer — integrates @lateen-os/workflow-engine contracts locally for editing. */
export default function WorkflowDesignerPage() {
  const [workflowName, setWorkflowName] = useState('Approval Flow');
  const [steps, setSteps] = useState(['Collect Input', 'Validate', 'Decision Review', 'Execute Action']);

  const graph = useMemo(() => {
    const nodes: Node[] = steps.map((step, i) => ({
      id: `step-${i}`,
      data: { label: step },
      position: { x: 80, y: i * 120 },
      style: { background: '#312e81', color: '#fff', borderRadius: 8, padding: 10, minWidth: 160 },
    }));
    const edges: Edge[] = steps.slice(1).map((_, i) => ({
      id: `e-${i}`,
      source: `step-${i}`,
      target: `step-${i + 1}`,
      animated: true,
      label: i === 2 ? 'Decision Engine' : undefined,
    }));
    return { nodes, edges };
  }, [steps]);

  function addStep() {
    setSteps((prev) => [...prev, `Step ${prev.length + 1}`]);
  }

  return (
    <div>
      <PageHeader
        title="Workflow Designer"
        description="Design business process workflows — integrates Workflow Engine and Decision Engine at execution time"
      />
      <div className="grid gap-6 p-8 xl:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow Definition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wf-name">Name</Label>
              <Input id="wf-name" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Steps map to workflow-engine StepDefinition. Approvals route through Decision Engine.
            </p>
            <Button onClick={addStep}>Add Step</Button>
          </CardContent>
        </Card>
        <FlowCanvas initialNodes={graph.nodes} initialEdges={graph.edges} />
      </div>
    </div>
  );
}
