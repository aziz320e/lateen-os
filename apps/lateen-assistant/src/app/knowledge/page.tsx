'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchMemory, searchPlatform } from '@/lib/api/client';

const CATEGORIES = ['document', 'research', 'lesson', 'playbook', 'policy'] as const;

export default function KnowledgePage() {
  const [query, setQuery] = useState('');
  const { data: memoryData } = useQuery({ queryKey: ['memory-all'], queryFn: () => fetchMemory() });
  const { data: searchData, refetch } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchPlatform(query),
    enabled: false,
  });

  const entries = memoryData?.entries ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Knowledge Explorer</h1>
        <p className="text-sm text-muted-foreground">Institutional Memory, Business DNA, documents, research, playbooks, policies</p>
      </div>

      <div className="flex gap-2 max-w-xl">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search knowledge…" onKeyDown={(e) => e.key === 'Enter' && refetch()} />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c} className="capitalize">{c}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="space-y-3 mt-4">
          {entries.slice(0, 20).map((e) => (
            <Card key={e.id}>
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{e.title}</CardTitle>
                  <Badge variant="outline">{e.category}</Badge>
                  <Badge variant="secondary">{e.source}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{e.summary}</CardContent>
            </Card>
          ))}
        </TabsContent>
        {CATEGORIES.map((c) => (
          <TabsContent key={c} value={c} className="space-y-3 mt-4">
            {entries.filter((e) => e.category === c).map((e) => (
              <Card key={e.id}>
                <CardHeader className="py-3"><CardTitle className="text-base">{e.title}</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">{e.summary}</CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {searchData?.results && searchData.results.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Search Results</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {searchData.results.map((r) => (
              <div key={`${r.type}-${r.id}`} className="rounded border p-2 text-sm">
                <Badge variant="outline">{r.type}</Badge> {r.title} — <span className="text-muted-foreground">{r.snippet}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
