'use client';

import { useQuery } from '@tanstack/react-query';
import { Bot, CheckCircle2, Compass, Sparkles } from 'lucide-react';
import {
  CapabilityUsageChart,
  DiscoveryTrendChart,
  MachineUtilizationChart,
  OpportunityScoreChart,
  RoiChart,
} from '@/components/charts/dashboard-charts';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  MissionHealthCard,
  MissionProgressCard,
  MissionTimeline,
  DecisionTimeline,
} from '@/components/missions/mission-dashboard';
import { Header } from '@/components/layout/header';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboard } from '@/lib/api/client';
import { cn, formatDate, statusColor } from '@/lib/utils';
import { runtimeMetrics } from '@/lib/runtime-metrics';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <div>
        <Header title="Dashboard" description="AI Product Manager overview" />
        <div className="grid gap-4 p-8 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Header title="Dashboard" />
        <p className="p-8 text-destructive">{(error as Error)?.message ?? 'Failed to load dashboard'}</p>
      </div>
    );
  }

  const metrics = runtimeMetrics(data.tasks);
  const currentTask = data.tasks.find((t) => t.status === 'running') ?? data.tasks[0];
  const pendingDecisions = data.decisions.filter((d) => d.status === 'pending' || d.status === 'waiting').length;

  return (
    <div>
      <Header
        title="Dashboard"
        description="Continuously discover profitable manufacturable products — recommendations only, no execution"
      />

      <div className="space-y-8 p-8">
        <div className="grid gap-4 xl:grid-cols-3">
          <MissionProgressCard mission={data.missionSummary.latestMission} />
          <MissionHealthCard summary={data.missionSummary} />
          {data.missionSummary.latestMission ? (
            <DecisionTimeline mission={data.missionSummary.latestMission} />
          ) : (
            <StatCard title="Mission Health" value="—" hint="Start a Launch Product mission" icon={Sparkles} />
          )}
        </div>

        {data.missionSummary.latestMission ? (
          <MissionTimeline mission={data.missionSummary.latestMission} />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Discovery Runs" value={data.runs.length} hint="Total pipeline executions" icon={Compass} />
          <StatCard
            title="Recommendations"
            value={data.recommendations.length}
            hint="Ready for decision review"
            icon={Sparkles}
          />
          <StatCard title="Pending Decisions" value={pendingDecisions} hint="Awaiting human approval" icon={CheckCircle2} />
          <StatCard
            title="Runtime Success"
            value={`${metrics.successRate}%`}
            hint={`${metrics.completed}/${metrics.total} tasks completed`}
            icon={Bot}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DiscoveryTrendChart runs={data.runs} />
          <OpportunityScoreChart recommendations={data.recommendations} />
          <RoiChart recommendations={data.recommendations} />
          <CapabilityUsageChart recommendations={data.recommendations} />
          <MachineUtilizationChart machines={data.machines} />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">AI Runtime — Current Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentTask ? (
                <>
                  <p className="font-medium">{currentTask.title}</p>
                  <Badge className={cn(statusColor(currentTask.status))}>{currentTask.status}</Badge>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Execution progress</p>
                    <Progress value={currentTask.status === 'completed' ? 100 : currentTask.status === 'running' ? 60 : 20} />
                  </div>
                  <p className="text-xs text-muted-foreground">Updated {formatDate(currentTask.updatedAt)}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No active tasks — run a discovery to begin.</p>
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Decision Engine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(['pending', 'waiting', 'approved', 'rejected'] as const).map((status) => {
                const count = data.decisions.filter((d) => d.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{status}</span>
                    <Badge className={cn(statusColor(status))}>{count}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Platform Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge className={cn(statusColor(data.health.status))}>{data.health.status}</Badge>
              {[...data.health.services, ...data.health.infrastructure].slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <Badge className={cn(statusColor(item.status))}>{item.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {data.recommendations.length > 0 ? (
          <div>
            <h2 className="mb-4 text-lg font-semibold">Latest Recommendations</h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {data.recommendations.slice(0, 2).map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
