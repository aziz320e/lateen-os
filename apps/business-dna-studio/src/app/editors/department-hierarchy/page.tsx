'use client';

import { useQuery } from '@tanstack/react-query';
import { buildHierarchyNodes, FlowCanvas } from '@/components/editors/flow-canvas';
import { PageHeader } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStudioDashboard } from '@/lib/api/client';

export default function DepartmentHierarchyPage() {
  const { data, isLoading } = useQuery({ queryKey: ['studio-dashboard'], queryFn: fetchStudioDashboard });
  const graph = data ? buildHierarchyNodes(data.departments, 'dept') : { nodes: [], edges: [] };

  return (
    <div>
      <PageHeader title="Department Hierarchy" description="Drag-and-drop department tree — changes persist via Business DNA Service" />
      <div className="p-8">
        {isLoading ? <Skeleton className="h-[600px]" /> : <FlowCanvas initialNodes={graph.nodes} initialEdges={graph.edges} />}
      </div>
    </div>
  );
}
