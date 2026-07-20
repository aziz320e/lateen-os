'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DiscoveryRecommendation, ProductDiscoveryRun } from '@/types';

export function DiscoveryTrendChart({ runs }: { runs: ProductDiscoveryRun[] }) {
  const data = [...runs]
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .slice(-8)
    .map((run, index) => ({
      name: `Run ${index + 1}`,
      recommendations: run.recommendation?.recommendations.length ?? 0,
      signals: run.collectSignals?.signals.length ?? 0,
    }));

  return (
    <ChartCard title="Discovery Trend" description="Signals collected and recommendations per run">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
          <Line type="monotone" dataKey="signals" stroke="#34d399" strokeWidth={2} name="Signals" />
          <Line type="monotone" dataKey="recommendations" stroke="#60a5fa" strokeWidth={2} name="Recommendations" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function OpportunityScoreChart({ recommendations }: { recommendations: DiscoveryRecommendation[] }) {
  const data = recommendations.slice(0, 8).map((rec, index) => ({
    name: rec.recommendationCandidate.title.slice(0, 16),
    score: parseFloat(rec.recommendationCandidate.score) * (parseFloat(rec.recommendationCandidate.score) <= 1 ? 100 : 1),
    rank: index + 1,
  }));

  return (
    <ChartCard title="Opportunity Score" description="Top recommendation confidence scores">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
          <Bar dataKey="score" fill="#34d399" radius={[4, 4, 0, 0]} name="Score" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RoiChart({ recommendations }: { recommendations: DiscoveryRecommendation[] }) {
  const data = recommendations.slice(0, 8).map((rec) => ({
    name: rec.recommendationCandidate.title.slice(0, 14),
    roi: parseFloat(rec.profitEstimate.estimatedMarginPercent),
    profit: parseFloat(rec.profitEstimate.projectedMonthlyProfit) / 1000,
  }));

  return (
    <ChartCard title="Estimated ROI" description="Margin % and projected monthly profit (K)">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
          <Bar dataKey="roi" fill="#a78bfa" name="Margin %" />
          <Bar dataKey="profit" fill="#34d399" name="Profit (K)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CapabilityUsageChart({ recommendations }: { recommendations: DiscoveryRecommendation[] }) {
  const usage = new Map<string, number>();
  for (const rec of recommendations) {
    for (const cap of rec.capabilityMatch.matchedCapabilities) {
      usage.set(cap.label, (usage.get(cap.label) ?? 0) + 1);
    }
  }
  const data = [...usage.entries()].map(([name, count]) => ({ name: name.slice(0, 18), count }));

  return (
    <ChartCard title="Capabilities Usage" description="Matched capabilities across recommendations">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" stroke="#94a3b8" fontSize={12} />
          <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={100} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
          <Bar dataKey="count" fill="#60a5fa" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function MachineUtilizationChart({ machines }: { machines: { id: string; name: string; status?: string }[] }) {
  const data = machines.slice(0, 8).map((machine, index) => ({
    name: machine.name.slice(0, 16),
    utilization: machine.status === 'active' ? 65 + (index % 4) * 8 : 25 + (index % 3) * 10,
  }));

  return (
    <ChartCard title="Machine Utilization" description="Estimated utilization from Business DNA fleet">
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

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
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
