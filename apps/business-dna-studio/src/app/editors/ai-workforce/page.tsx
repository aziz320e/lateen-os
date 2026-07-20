'use client';

import { useQuery } from '@tanstack/react-query';
import type { Edge, Node } from '@xyflow/react';
import { useMemo } from 'react';
import { FlowCanvas } from '@/components/editors/flow-canvas';
import { PageHeader } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStudioDashboard } from '@/lib/api/client';
import { displayName } from '@/lib/utils';

export default function AiWorkforceHierarchyPage() {
  const { data, isLoading } = useQuery({ queryKey: ['studio-dashboard'], queryFn: fetchStudioDashboard });

  const graph = useMemo(() => {
    if (!data) return { nodes: [] as Node[], edges: [] as Edge[] };
    const root: Node = {
      id: 'workforce-root',
      data: { label: 'AI Workforce' },
      position: { x: 280, y: 0 },
      style: { background: '#7c3aed', color: '#fff', borderRadius: 8, padding: 12 },
    };
    const agents = data.agents.map((agent, i) => ({
      id: String(agent.id ?? `agent-${i}`),
      data: { label: `${displayName(agent)}\n${String(agent.workforceType ?? 'general')}` },
      position: { x: (i % 4) * 200, y: 140 + Math.floor(i / 4) * 120 },
      style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #7c3aed', borderRadius: 8, padding: 8 },
    }));
    const edges: Edge[] = agents.map((a, i) => ({
      id: `wa-${i}`,
      source: 'workforce-root',
      target: a.id,
      animated: true,
    }));
    return { nodes: [root, ...agents], edges };
  }, [data]);

  return (
    <div>
      <PageHeader
        title="AI Workforce Hierarchy"
        description="Visualize AI agent organization — integrates @lateen-os/ai-workforce contracts"
      />
      <div className="p-8">
        {isLoading ? <Skeleton className="h-[600px]" /> : <FlowCanvas initialNodes={graph.nodes} initialEdges={graph.edges} />}
      </div>
    </div>
  );
}
