'use client';

import Link from 'next/link';
import type { WorkerDesign } from '@/lib/types/studio';
import { WORKER_TOOLS } from '@/lib/types/studio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export function WorkerDesigner({ worker }: { worker: WorkerDesign }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{worker.name}</h2>
            <Badge className={worker.status === 'published' ? 'border-green-500/50 text-green-400' : ''}>{worker.status}</Badge>
            <Badge>v{worker.version}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{worker.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/prompt-studio?workerId=${worker.id}`}>Open Prompt Studio</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/testing?workerId=${worker.id}`}>Test in Sandbox</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="role">Role</TabsTrigger>
          <TabsTrigger value="goal">Goal</TabsTrigger>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="temperature">Temperature</TabsTrigger>
          <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
          <TabsTrigger value="memory">Memory Access</TabsTrigger>
          <TabsTrigger value="dna">Business DNA</TabsTrigger>
          <TabsTrigger value="institutional">Institutional</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="decision">Decision</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
          <TabsTrigger value="runtime">Runtime Limits</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="retry">Retry</TabsTrigger>
          <TabsTrigger value="fallback">Fallback</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>General</CardTitle><CardDescription>Worker identity and lifecycle</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="ID" value={worker.id} />
              <Field label="Organization" value={worker.organizationId} />
              <Field label="Updated" value={new Date(worker.updatedAt).toLocaleString()} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role"><Card><CardContent className="pt-4"><Field label="Role" value={worker.role} /></CardContent></Card></TabsContent>
        <TabsContent value="goal"><Card><CardContent className="pt-4"><Field label="Goal" value={worker.goal} /></CardContent></Card></TabsContent>
        <TabsContent value="instructions"><Card><CardContent className="pt-4"><Field label="Instructions" value={worker.instructions} /></CardContent></Card></TabsContent>

        <TabsContent value="temperature">
          <Card><CardContent className="pt-4"><Field label="Temperature Policy" value={worker.temperaturePolicy} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="reasoning">
          <Card><CardContent className="pt-4"><Field label="Reasoning Policy" value={worker.reasoningPolicy} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="memory">
          <Card>
            <CardContent className="flex flex-wrap gap-2 pt-4">
              {worker.memoryAccess.map((m) => <Badge key={m}>{m}</Badge>)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dna">
          <Card><CardContent className="pt-4"><Field label="Business DNA Access" value={worker.businessDnaAccess ? 'Enabled' : 'Disabled'} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="institutional">
          <Card><CardContent className="pt-4"><Field label="Institutional Memory Access" value={worker.institutionalMemoryAccess ? 'Enabled' : 'Disabled'} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card><CardContent className="pt-4"><Field label="Knowledge Access" value={worker.knowledgeAccess ? 'Enabled' : 'Disabled'} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="decision">
          <Card><CardContent className="pt-4"><Field label="Decision Policy" value={worker.decisionPolicy} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card>
            <CardContent className="flex flex-wrap gap-2 pt-4">
              {WORKER_TOOLS.map((t) => (
                <Badge key={t} className={worker.toolPermissions.includes(t) ? 'border-primary/50 text-primary' : 'opacity-40'}>{t}</Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectors">
          <Card>
            <CardContent className="flex flex-wrap gap-2 pt-4">
              {worker.connectorPermissions.length ? worker.connectorPermissions.map((c) => <Badge key={c}>{c}</Badge>) : 'None configured'}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runtime">
          <Card>
            <CardContent className="grid gap-4 pt-4 md:grid-cols-2">
              <Field label="Max Tokens" value={worker.runtimeLimits.maxTokens} />
              <Field label="Timeout (ms)" value={worker.runtimeLimits.timeoutMs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardContent className="grid gap-4 pt-4 md:grid-cols-2">
              <Field label="Max Cost (USD)" value={worker.budgetLimits.maxCostUsd} />
              <Field label="Daily Quota" value={worker.budgetLimits.dailyQuota} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retry">
          <Card>
            <CardContent className="grid gap-4 pt-4 md:grid-cols-2">
              <Field label="Attempts" value={worker.retryPolicy.attempts} />
              <Field label="Delay (ms)" value={worker.retryPolicy.delayMs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fallback">
          <Card>
            <CardContent className="grid gap-4 pt-4 md:grid-cols-2">
              <Field label="Enabled" value={worker.fallbackPolicy.enabled ? 'Yes' : 'No'} />
              <Field label="Fallback Worker" value={worker.fallbackPolicy.workerId ?? '—'} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
