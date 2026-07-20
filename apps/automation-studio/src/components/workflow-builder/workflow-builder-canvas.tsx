'use client';

import { useCallback, useState } from 'react';
import {
  Background, Controls, MiniMap, Panel, ReactFlow, addEdge,
  useEdgesState, useNodesState, type Connection, type Node,
} from '@xyflow/react';
import { Redo2, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import type { AutomationDesign, FlowNodeType } from '@/lib/types/automation';
import { FLOW_NODE_TYPES } from '@/lib/types/automation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const NODE_COLORS: Partial<Record<FlowNodeType, string>> = {
  trigger: 'border-green-500/50 bg-green-500/10',
  condition: 'border-yellow-500/50 bg-yellow-500/10',
  decision: 'border-orange-500/50 bg-orange-500/10',
  'ai-worker': 'border-purple-500/50 bg-purple-500/10',
  mission: 'border-blue-500/50 bg-blue-500/10',
  workflow: 'border-cyan-500/50 bg-cyan-500/10',
};

function toFlowNodes(automation: AutomationDesign): Node[] {
  return automation.nodes.map((n) => ({
    id: n.id,
    type: 'default',
    position: n.position,
    data: { label: n.label, nodeType: n.type },
    className: NODE_COLORS[n.type] ?? 'border-border bg-card',
  }));
}

function toFlowEdges(automation: AutomationDesign) {
  return automation.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
  }));
}

export function WorkflowBuilderCanvas({ automation }: { automation: AutomationDesign }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(automation));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(automation));
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [history, setHistory] = useState<{ nodes: Node[]; edges: typeof edges }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  function pushHistory() {
    setHistory((h) => [...h.slice(0, historyIndex + 1), { nodes: [...nodes], edges: [...edges] }]);
    setHistoryIndex((i) => i + 1);
  }

  function undo() {
    if (historyIndex < 0) return;
    const prev = history[historyIndex];
    if (!prev) return;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setHistoryIndex((i) => i - 1);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    if (!next) return;
    setNodes(next.nodes);
    setEdges(next.edges);
    setHistoryIndex((i) => i + 1);
  }

  function addNode(type: FlowNodeType) {
    pushHistory();
    const id = `n-${Date.now()}`;
    setNodes((nds) => [...nds, {
      id,
      type: 'default',
      position: { x: 100 + nds.length * 30, y: 100 + nds.length * 20 },
      data: { label: type, nodeType: type },
      className: NODE_COLORS[type] ?? 'border-border bg-card',
    }]);
  }

  function validate() {
    const errors: string[] = [];
    const hasTrigger = nodes.some((n) => n.data.nodeType === 'trigger');
    if (!hasTrigger) errors.push('Missing trigger node');
    if (nodes.length === 0) errors.push('Workflow is empty');
    const orphanNodes = nodes.filter((n) => {
      const hasEdge = edges.some((e) => e.source === n.id || e.target === n.id);
      return nodes.length > 1 && !hasEdge;
    });
    if (orphanNodes.length > 0) errors.push(`${orphanNodes.length} disconnected node(s)`);
    setValidation({ valid: errors.length === 0, errors });
  }

  return (
    <div className="flex gap-4">
      <aside className="w-48 shrink-0 space-y-1 rounded-lg border bg-card p-3">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Node Palette</div>
        {FLOW_NODE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addNode(type)}
            className="block w-full rounded-md px-2 py-1 text-left text-xs hover:bg-muted"
          >
            {type}
          </button>
        ))}
      </aside>

      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={undo} disabled={historyIndex < 0}><Undo2 className="h-3 w-3" /></Button>
          <Button size="sm" variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo2 className="h-3 w-3" /></Button>
          <Button size="sm" variant="outline" onClick={validate}>Validate</Button>
          <span className="text-xs text-muted-foreground">{nodes.length} nodes · {edges.length} edges</span>
        </div>

        <div className="h-[520px] rounded-lg border">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-right" className="flex gap-1">
              <Button size="sm" variant="outline"><ZoomIn className="h-3 w-3" /></Button>
              <Button size="sm" variant="outline"><ZoomOut className="h-3 w-3" /></Button>
            </Panel>
          </ReactFlow>
        </div>

        {validation && (
          <div className={`mt-3 rounded-md border p-3 text-sm ${validation.valid ? 'border-green-500/50' : 'border-red-500/50'}`}>
            {validation.valid ? (
              <Badge className="border-green-500/50 text-green-400">Valid</Badge>
            ) : (
              <ul className="list-inside list-disc text-red-400">
                {validation.errors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
