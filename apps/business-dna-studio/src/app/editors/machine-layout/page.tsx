'use client';

import { useQuery } from '@tanstack/react-query';
import { buildGridNodes, FlowCanvas } from '@/components/editors/flow-canvas';
import { PageHeader } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStudioDashboard } from '@/lib/api/client';

export default function MachineLayoutPage() {
  const { data, isLoading } = useQuery({ queryKey: ['studio-dashboard'], queryFn: fetchStudioDashboard });
  const graph = data ? buildGridNodes(data.machines, 'machine', 3) : { nodes: [], edges: [] };

  return (
    <div>
      <PageHeader title="Machine Layout" description="Drag-and-drop floor layout for production equipment" />
      <div className="p-8">
        {isLoading ? <Skeleton className="h-[600px]" /> : <FlowCanvas initialNodes={graph.nodes} initialEdges={graph.edges} height="700px" />}
      </div>
    </div>
  );
}
