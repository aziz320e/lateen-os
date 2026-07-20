'use client';

import { useQuery } from '@tanstack/react-query';
import type { Edge, Node } from '@xyflow/react';
import { useMemo } from 'react';
import { buildHierarchyNodes, FlowCanvas } from '@/components/editors/flow-canvas';
import { PageHeader } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStudioDashboard } from '@/lib/api/client';

export default function OrgChartEditorPage() {
  const { data, isLoading } = useQuery({ queryKey: ['studio-dashboard'], queryFn: fetchStudioDashboard });

  const graph = useMemo(() => {
    if (!data) return { nodes: [] as Node[], edges: [] as Edge[] };
    const orgNode: Node = {
      id: 'org',
      data: { label: String(data.organization?.name ?? 'Organization') },
      position: { x: 300, y: 0 },
      style: { background: '#1d4ed8', color: '#fff', borderRadius: 8, padding: 12, fontWeight: 600 },
    };
    const branchGraph = buildHierarchyNodes(data.branches, 'branch');
    const deptGraph = buildHierarchyNodes(data.departments, 'dept');
    branchGraph.nodes.forEach((n, i) => {
      n.position = { x: i * 220, y: 120 };
    });
    deptGraph.nodes.forEach((n, i) => {
      n.position = { x: i * 200, y: 280 };
    });
    const edges: Edge[] = [
      ...branchGraph.nodes.map((n, i) => ({ id: `ob-${i}`, source: 'org', target: n.id, animated: true })),
      ...deptGraph.nodes.map((n, i) => ({
        id: `bd-${i}`,
        source: branchGraph.nodes[0]?.id ?? 'org',
        target: n.id,
      })),
    ];
    return { nodes: [orgNode, ...branchGraph.nodes, ...deptGraph.nodes], edges };
  }, [data]);

  return (
    <div>
      <PageHeader title="Organization Chart" description="Visual hierarchy of organization, branches, and departments" />
      <div className="p-8">
        {isLoading ? <Skeleton className="h-[600px]" /> : <FlowCanvas initialNodes={graph.nodes} initialEdges={graph.edges} />}
      </div>
    </div>
  );
}
