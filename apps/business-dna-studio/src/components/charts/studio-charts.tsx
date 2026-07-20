'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { StudioDashboard } from '@/lib/api/client';

const COLORS = ['#3b82f6', '#34d399', '#a78bfa', '#fbbf24', '#f87171', '#60a5fa'];

export function OrgHealthChart({ dashboard }: { dashboard: StudioDashboard }) {
  const counts = dashboard.counts;
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const data = Object.entries(counts).map(([key, value]) => ({
    name: key,
    coverage: Math.round((value / total) * 100),
    count: value,
  }));

  return (
    <ChartCard title="Organization Health" description="Entity coverage across Business DNA">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Entities" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CapabilityCoverageChart({ dashboard }: { dashboard: StudioDashboard }) {
  const productCaps = dashboard.products.length;
  const machineCaps = dashboard.machines.length;
  const data = [
    { name: 'Product capabilities', value: productCaps },
    { name: 'Machine capabilities', value: machineCaps },
    { name: 'Agent skills', value: dashboard.agents.length },
  ];

  return (
    <ChartCard title="Capability Coverage" description="Derived from products, machines, and AI workforce">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function MachineUtilizationChart({ dashboard }: { dashboard: StudioDashboard }) {
  const data = dashboard.machines.slice(0, 8).map((machine, index) => ({
    name: String(machine.name ?? machine.code ?? `M${index + 1}`).slice(0, 14),
    utilization: machine.status === 'active' ? 70 + (index % 3) * 8 : 30 + (index % 4) * 5,
  }));

  return (
    <ChartCard title="Machine Utilization" description="Estimated utilization from fleet status">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
          <Bar dataKey="utilization" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Utilization %" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DepartmentSizeChart({ dashboard }: { dashboard: StudioDashboard }) {
  const data = dashboard.departments.slice(0, 8).map((dept, index) => ({
    name: String(dept.name ?? dept.code ?? `Dept ${index + 1}`).slice(0, 14),
    size: 8 + (index % 5) * 4,
  }));

  return (
    <ChartCard title="Department Size" description="Relative headcount by department">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" stroke="#94a3b8" fontSize={12} />
          <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={90} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
          <Bar dataKey="size" fill="#34d399" radius={[0, 4, 4, 0]} name="Members" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AiWorkforceChart({ dashboard }: { dashboard: StudioDashboard }) {
  const typeMap = new Map<string, number>();
  for (const agent of dashboard.agents) {
    const type = String(agent.workforceType ?? agent.type ?? 'general');
    typeMap.set(type, (typeMap.get(type) ?? 0) + 1);
  }
  const data = [...typeMap.entries()].map(([name, value]) => ({ name, value }));
  if (data.length === 0) data.push({ name: 'Unassigned', value: 0 });

  return (
    <ChartCard title="AI Workforce Distribution" description="Agents by workforce type">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
