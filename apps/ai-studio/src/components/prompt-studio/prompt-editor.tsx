'use client';

import dynamic from 'next/dynamic';
import type { PromptDesign } from '@/lib/types/studio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

function EditorPanel({ value, language = 'markdown' }: { value: string; language?: string }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <MonacoEditor
        height="240px"
        language={language}
        theme="vs-dark"
        value={value}
        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
      />
    </div>
  );
}

export function PromptEditor({ prompt }: { prompt: PromptDesign }) {
  return (
    <Tabs defaultValue="system">
      <TabsList>
        <TabsTrigger value="system">System Prompt</TabsTrigger>
        <TabsTrigger value="developer">Developer Prompt</TabsTrigger>
        <TabsTrigger value="templates">User Templates</TabsTrigger>
        <TabsTrigger value="variables">Variables</TabsTrigger>
        <TabsTrigger value="context">Context Injection</TabsTrigger>
        <TabsTrigger value="schema">Output Schema</TabsTrigger>
        <TabsTrigger value="history">Version History</TabsTrigger>
      </TabsList>

      <TabsContent value="system">
        <Card><CardHeader><CardTitle>System Prompt</CardTitle></CardHeader><CardContent><EditorPanel value={prompt.systemPrompt} /></CardContent></Card>
      </TabsContent>

      <TabsContent value="developer">
        <Card><CardHeader><CardTitle>Developer Prompt</CardTitle></CardHeader><CardContent><EditorPanel value={prompt.developerPrompt} /></CardContent></Card>
      </TabsContent>

      <TabsContent value="templates">
        <Card>
          <CardHeader><CardTitle>User Prompt Templates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {prompt.userPromptTemplates.map((t) => (
              <div key={t.id} className="rounded-md border p-3">
                <div className="mb-2 font-medium">{t.name}</div>
                <EditorPanel value={t.template} />
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="variables">
        <Card>
          <CardContent className="flex flex-wrap gap-2 pt-4">
            {prompt.variables.map((v) => <Badge key={v}>{`{{${v}}}`}</Badge>)}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="context">
        <Card>
          <CardContent className="flex flex-wrap gap-2 pt-4">
            {prompt.contextInjection.map((c) => <Badge key={c}>{c}</Badge>)}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="schema">
        <Card><CardContent className="pt-4"><EditorPanel value={prompt.outputSchema} language="json" /></CardContent></Card>
      </TabsContent>

      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
            <CardDescription>Read-only design-time versions — deployment via AI Workforce</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">Current version: <Badge>v{prompt.version}</Badge></div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
