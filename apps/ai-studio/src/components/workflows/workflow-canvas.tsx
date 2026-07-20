'use client';

import { Background, Controls, MiniMap, ReactFlow, addEdge, useEdgesState, useNodesState, type Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Worker Trigger' } },
  { id: '2', position: { x: 200, y: 0 }, data: { label: 'Knowledge Lookup' } },
  { id: '3', position: { x: 400, y: 0 }, data: { label: 'AI Runtime (external)' } },
  { id: '4', position: { x: 600, y: 0 }, data: { label: 'Decision Engine (external)' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
];

export function WorkflowCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = (params: Connection) => setEdges((eds) => addEdge(params, eds));

  return (
    <div className="h-[420px] rounded-lg border">
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
