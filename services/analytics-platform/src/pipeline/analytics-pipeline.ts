import { randomUUID } from 'node:crypto';
import type {
  AnalyticsPipelineResult,
  AnalyticsRequest,
  ChartData,
  DashboardData,
  DashboardId,
  KpiValue,
  MetricId,
  MetricSnapshot,
  PipelineStepId,
} from '../domain/types.js';
import { PIPELINE_STEPS } from '../domain/types.js';
import type { SourceCollectorRegistry } from '../collectors/source-collector.js';
import {
  aggregateByMetric,
  normalizeDataPoints,
  toMetricSnapshots,
} from '../collectors/source-collector.js';

const DASHBOARD_DOMAIN: Record<DashboardId, import('../domain/types.js').AnalyticsDomain> = {
  ceo: 'executive',
  finance: 'finance',
  operations: 'operations',
  sales: 'sales',
  production: 'production',
  warehouse: 'operations',
  'customer-success': 'customers',
  'ai-operations': 'ai-runtime',
  'platform-health': 'infrastructure',
  marketplace: 'marketplace',
};

const DASHBOARD_KPIS: Record<DashboardId, MetricId[]> = {
  ceo: ['revenue', 'profit', 'gross-margin', 'pipeline'],
  finance: ['revenue', 'profit', 'gross-margin'],
  operations: ['machine-utilization', 'production-time', 'downtime'],
  sales: ['pipeline', 'conversion', 'revenue'],
  production: ['machine-utilization', 'quality-score', 'production-time'],
  warehouse: ['machine-utilization', 'downtime'],
  'customer-success': ['customer-satisfaction', 'conversion'],
  'ai-operations': ['ai-cost', 'ai-tokens', 'worker-productivity'],
  'platform-health': ['connector-health', 'downtime'],
  marketplace: ['marketplace-downloads', 'revenue'],
};

const METRIC_LABELS: Record<MetricId, string> = {
  revenue: 'Revenue',
  profit: 'Profit',
  'gross-margin': 'Gross Margin',
  pipeline: 'Pipeline',
  conversion: 'Conversion',
  'machine-utilization': 'Machine Utilization',
  'production-time': 'Production Time',
  downtime: 'Downtime',
  'quality-score': 'Quality Score',
  'customer-satisfaction': 'Customer Satisfaction',
  'workflow-success': 'Workflow Success',
  'mission-success': 'Mission Success',
  'worker-productivity': 'Worker Productivity',
  'ai-cost': 'AI Cost',
  'ai-tokens': 'AI Tokens',
  'knowledge-growth': 'Knowledge Growth',
  'search-usage': 'Search Usage',
  'marketplace-downloads': 'Marketplace Downloads',
  'connector-health': 'Connector Health',
};

export class AnalyticsPipeline {
  constructor(private readonly registry: SourceCollectorRegistry) {}

  async execute(request: AnalyticsRequest): Promise<AnalyticsPipelineResult> {
    const started = Date.now();
    const correlationId = request.correlationId ?? randomUUID();
    const stepTimings: { step: PipelineStepId; durationMs: number }[] = [];

    const runStep = async <T>(step: PipelineStepId, fn: () => Promise<T>): Promise<T> => {
      const s = Date.now();
      const result = await fn();
      stepTimings.push({ step, durationMs: Date.now() - s });
      return result;
    };

    const dashboardId = request.dashboardId ?? 'ceo';
    const domain = request.domain ?? DASHBOARD_DOMAIN[dashboardId as DashboardId] ?? 'executive';

    const raw = await runStep('collect', async () => {
      const collector = this.registry.get(domain);
      return collector ? collector.collect(request.organizationId) : [];
    });

    const normalized = await runStep('normalize', async () => normalizeDataPoints(raw, domain));
    const aggregated = await runStep('aggregate', async () => aggregateByMetric(normalized));
    const metrics = await runStep('calculate-metrics', async () => toMetricSnapshots(aggregated, domain));
    const kpis = await runStep('generate-kpis', async () => generateKpis(dashboardId as DashboardId, metrics));
    const dashboard = await runStep('prepare-dashboard', async () =>
      buildDashboard(dashboardId as DashboardId, kpis, metrics),
    );

    await runStep('return', async () => undefined);

    return {
      steps: stepTimings,
      dashboard,
      metrics,
      latencyMs: Date.now() - started,
      correlationId,
    };
  }
}

function generateKpis(dashboardId: DashboardId, metrics: readonly MetricSnapshot[]): KpiValue[] {
  const kpiIds = DASHBOARD_KPIS[dashboardId] ?? [];
  return kpiIds.map((id) => {
    const snap = metrics.find((m) => m.id === id);
    const value = snap?.value ?? 0;
    const isPercent = id.includes('margin') || id.includes('conversion') || id.includes('success') || id.includes('utilization') || id.includes('health') || id.includes('productivity') || id.includes('score');
    return {
      id,
      label: METRIC_LABELS[id],
      value: isPercent ? `${(value * 100).toFixed(1)}%` : value >= 1000 ? value.toLocaleString() : value,
      unit: snap?.unit,
      change: Math.round((Math.random() - 0.4) * 20) / 10,
      trend: value > 0 ? 'up' : 'flat',
    };
  });
}

function buildDashboard(
  dashboardId: DashboardId,
  kpis: readonly KpiValue[],
  metrics: readonly MetricSnapshot[],
): DashboardData {
  const domain = DASHBOARD_DOMAIN[dashboardId];
  const charts: ChartData[] = [
    {
      type: 'line',
      title: 'Trend',
      series: [{ name: kpis[0]?.label ?? 'Metric', data: generateTrendData(metrics[0]?.value ?? 100) }],
    },
    {
      type: 'bar',
      title: 'Comparison',
      series: [{ name: 'Current', data: kpis.slice(0, 4).map((k, i) => ({ x: k.label, y: typeof k.value === 'number' ? k.value : (i + 1) * 100 })) }],
    },
    {
      type: 'pie',
      title: 'Distribution',
      series: [{ name: 'Share', data: kpis.map((k, i) => ({ x: k.label, y: 25 - i * 3 })) }],
    },
  ];

  return {
    id: dashboardId,
    name: dashboardId.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    domain,
    kpis,
    charts,
    generatedAt: new Date().toISOString(),
  };
}

function generateTrendData(base: number) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((d, i) => ({ x: d, y: Math.round(base * (0.85 + i * 0.03)) }));
}
