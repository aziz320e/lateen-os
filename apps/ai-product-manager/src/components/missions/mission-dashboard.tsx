'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn, statusColor } from '@/lib/utils';
import type { LaunchProductMissionState } from '@lateen-os/launch-product-mission/client';
import { getMissionProgress } from '@lateen-os/launch-product-mission/client';

export function MissionProgressCard({ mission }: { mission: LaunchProductMissionState | null }) {
  if (!mission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Launch Product Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active mission — start one from the Missions page.</p>
        </CardContent>
      </Card>
    );
  }

  const progress = getMissionProgress(mission);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Launch Product Mission</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{mission.title}</span>
          <Badge className={cn(statusColor(mission.status))}>{mission.status}</Badge>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
        <p className="text-xs text-muted-foreground">
          Current stage: {mission.stages.find((s) => s.code === mission.currentStage)?.name ?? mission.currentStage}
        </p>
        <div className="flex gap-2 flex-wrap">
          <Badge className={cn(mission.consensusReached ? 'border-emerald-500 text-emerald-500' : '')}>
            Consensus {mission.consensusReached ? '✓' : '…'}
          </Badge>
          <Badge className={cn(mission.decisionApproved ? 'border-emerald-500 text-emerald-500' : '')}>
            Decision {mission.decisionApproved ? '✓' : '…'}
          </Badge>
          <Badge>Health: {mission.health}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function MissionTimeline({ mission }: { mission: LaunchProductMissionState }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Worker Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
        {mission.stages.map((stage) => (
          <div key={stage.code} className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
            <div>
              <p className="font-medium">{stage.name}</p>
              {stage.workerRole ? <p className="text-xs text-muted-foreground">{stage.workerRole}</p> : null}
            </div>
            <Badge className={cn(statusColor(stage.status))}>{stage.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DecisionTimeline({ mission }: { mission: LaunchProductMissionState }) {
  const decisionEvents = mission.events.filter((e) =>
    ['DecisionApproved', 'ConsensusReached', 'MissionEscalated'].includes(e.eventName),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Decision Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {decisionEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No decision events yet.</p>
        ) : (
          decisionEvents.map((event, i) => (
            <div key={i} className="text-sm">
              <p className="font-medium">{event.eventName}</p>
              <p className="text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function MissionHealthCard({
  summary,
}: {
  summary: {
    activeMissions: number;
    completedMissions: number;
    escalatedMissions: number;
    failedMissions: number;
    averageProgress: number;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mission Health</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Active</span><p className="font-semibold">{summary.activeMissions}</p></div>
        <div><span className="text-muted-foreground">Completed</span><p className="font-semibold">{summary.completedMissions}</p></div>
        <div><span className="text-muted-foreground">Escalated</span><p className="font-semibold">{summary.escalatedMissions}</p></div>
        <div><span className="text-muted-foreground">Failed</span><p className="font-semibold">{summary.failedMissions}</p></div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Avg progress</span>
          <Progress value={summary.averageProgress} className="mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}
