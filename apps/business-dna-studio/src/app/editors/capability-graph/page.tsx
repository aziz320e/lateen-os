'use client';

import { useQuery } from '@tanstack/react-query';
import type { Edge, Node } from '@xyflow/react';
import { useMemo } from 'react';
import { FlowCanvas } from '@/components/editors/flow-canvas';
import { PageHeader } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStudioDashboard } from '@/lib/api/client';
import { displayName } from '@/lib/utils';

export default function CapabilityGraphPage() {
  const { data, isLoading } = useQuery({ queryKey: ['studio-dashboard'], queryFn: fetchStudioDashboard });

  const graph = useMemo(() => {
    if (!data) return { nodes: [] as Node[], edges: [] as Edge[] };
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    data.products.forEach((p, i) => {
      const pid = `p-${p.id}`;
      nodes.push({
        id: pid,
        data: { label: displayName(p) },
        position: { x: (i % 3) * 220, y: 0 },
        style: { background: '#065f46', color: '#fff', borderRadius: 8, padding: 8 },
      });
    });
    data.machines.forEach((m, i) => {
      const mid = `m-${m.id}`;
      nodes.push({
        id: mid,
        data: { label: displayName(m) },
        position: { x: (i % 3) * 220, y: 160 },
        style: { background: '#1e3a8a', color: '#fff', borderRadius: 8, padding: 8 },
      });
      const product = data.products[i % Math.max(data.products.length, 1)];
      if (product) {
        edges.push({ id: `pm-${i}`, source: `p-${product.id}`, target: mid, animated: true, label: 'enables' });
      }
    });
    return { nodes, edges };
  }, [data]);

  return (
    <div>
      <PageHeader title="Capability Graph" description="Relationship visualization between products, machines, and derived capabilities" />
      <div className="p-8">
        {isLoading ? <Skeleton className="h-[600px]" /> : <FlowCanvas initialNodes={graph.nodes} initialEdges={graph.edges} />}
      </div>
    </div>
  );
}
