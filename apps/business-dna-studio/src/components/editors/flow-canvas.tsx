'use client';

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export function FlowCanvas({
  initialNodes,
  initialEdges,
  height = '600px',
}: {
  initialNodes: Node[];
  initialEdges: Edge[];
  height?: string;
}) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ height }} className="rounded-lg border bg-background">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          nodesDraggable
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

export function buildHierarchyNodes(
  items: Record<string, unknown>[],
  prefix: string,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = items.map((item, index) => ({
    id: String(item.id ?? `${prefix}-${index}`),
    data: { label: String(item.name ?? item.code ?? item.id) },
    position: { x: (index % 4) * 220, y: Math.floor(index / 4) * 120 },
    style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: 8, padding: 8 },
  }));

  const edges: Edge[] = nodes.slice(1).map((node, i) => ({
    id: `e-${i}`,
    source: nodes[0]!.id,
    target: node.id,
    animated: true,
  }));

  return { nodes, edges };
}

export function buildGridNodes(
  items: Record<string, unknown>[],
  prefix: string,
  cols = 4,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = items.map((item, index) => ({
    id: String(item.id ?? `${prefix}-${index}`),
    data: { label: String(item.name ?? item.code ?? item.id) },
    position: { x: (index % cols) * 200, y: Math.floor(index / cols) * 140 },
    style: { background: '#172554', color: '#f8fafc', border: '1px solid #3b82f6', borderRadius: 8, padding: 8, minWidth: 140 },
  }));
  return { nodes, edges: [] };
}
