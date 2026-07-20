'use client';

import { useMemo } from 'react';
import { Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export function OrganizationGraph({
  organizationName,
  departments,
  employees,
}: {
  organizationName: string;
  departments: Record<string, unknown>[];
  employees: Record<string, unknown>[];
}) {
  const initialNodes = useMemo(() => {
    const nodes = [
      {
        id: 'org',
        position: { x: 300, y: 0 },
        data: { label: organizationName },
        style: { background: 'hsl(var(--primary) / 0.2)', border: '1px solid hsl(var(--primary))', borderRadius: 8, padding: 12 },
      },
    ];

    departments.slice(0, 8).forEach((dept, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      nodes.push({
        id: `dept-${dept.id ?? i}`,
        position: { x: col * 200, y: 120 + row * 100 },
        data: { label: String(dept.name ?? `Department ${i + 1}`) },
        style: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, padding: 10 },
      });
    });

    employees.slice(0, 6).forEach((emp, i) => {
      nodes.push({
        id: `emp-${emp.id ?? i}`,
        position: { x: 50 + i * 120, y: 320 },
        data: { label: String(emp.name ?? emp.fullName ?? `Employee ${i + 1}`) },
        style: { background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))', borderRadius: 8, padding: 8 },
      });
    });

    return nodes;
  }, [organizationName, departments, employees]);

  const initialEdges = useMemo(() => {
    const edges: { id: string; source: string; target: string }[] = [];
    departments.slice(0, 8).forEach((dept, i) => {
      edges.push({ id: `e-org-dept-${i}`, source: 'org', target: `dept-${dept.id ?? i}` });
    });
    employees.slice(0, 6).forEach((emp, i) => {
      const deptIdx = i % Math.max(departments.length, 1);
      const dept = departments[deptIdx];
      if (dept) edges.push({ id: `e-dept-emp-${i}`, source: `dept-${dept.id ?? deptIdx}`, target: `emp-${emp.id ?? i}` });
    });
    return edges;
  }, [departments, employees]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[480px] rounded-lg border bg-card/30">
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView>
        <Background gap={16} color="hsl(var(--border))" />
        <Controls />
        <MiniMap nodeColor="hsl(var(--primary))" maskColor="hsl(var(--background) / 0.8)" />
      </ReactFlow>
    </div>
  );
}
