'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Rocket } from 'lucide-react';
import { MissionProgressCard, MissionTimeline } from '@/components/missions/mission-dashboard';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMissions, startMission } from '@/lib/api/client';
import { cn, statusColor } from '@/lib/utils';
import { useState } from 'react';
import { getMissionProgress } from '@lateen-os/launch-product-mission/client';

export default function MissionsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('Smart Home Air Purifier');
  const [scenario, setScenario] = useState<'happy_path' | 'escalation_path' | 'rejected_path' | 'retry_path'>('happy_path');

  const { data, isLoading } = useQuery({ queryKey: ['missions'], queryFn: fetchMissions });

  const mutation = useMutation({
    mutationFn: () => startMission({ opportunityTitle: title, scenario }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const latest = data?.missions[0];

  return (
    <div>
      <Header
        title="Launch Product Mission"
        description="First executable multi-agent mission — opportunity to approved product"
      />

      <div className="space-y-8 p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="h-4 w-4" /> Start Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="title">Opportunity Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario">Simulation Scenario</Label>
              <select
                id="scenario"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={scenario}
                onChange={(e) => setScenario(e.target.value as typeof scenario)}
              >
                <option value="happy_path">Happy path</option>
                <option value="escalation_path">Escalation path</option>
                <option value="rejected_path">Rejected path</option>
                <option value="retry_path">Retry path</option>
              </select>
            </div>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Starting…' : 'Launch Mission'}
            </Button>
          </CardContent>
        </Card>

        {isLoading ? (
          <Skeleton className="h-48" />
        ) : latest ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <MissionProgressCard mission={latest} />
            <MissionTimeline mission={latest} />
          </div>
        ) : null}

        {data?.missions.length ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Mission History</h2>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Scenario</th>
                    <th className="px-4 py-3 text-left">Progress</th>
                    <th className="px-4 py-3 text-left">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {data.missions.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-4 py-3 font-mono text-xs">{m.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3"><Badge className={cn(statusColor(m.status))}>{m.status}</Badge></td>
                      <td className="px-4 py-3">{m.scenario ?? '—'}</td>
                      <td className="px-4 py-3">{getMissionProgress(m)}%</td>
                      <td className="px-4 py-3">{m.health}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
