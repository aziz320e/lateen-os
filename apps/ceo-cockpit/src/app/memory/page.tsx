'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchMemory } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';

const categories = ['knowledge', 'lesson', 'incident', 'research', 'decision'] as const;

export default function MemoryPage() {
  const { data, isLoading } = useQuery({ queryKey: ['memory'], queryFn: fetchMemory });

  if (isLoading || !data) {
    return <div><Header title="Institutional Memory" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  return (
    <div>
      <Header title="Institutional Memory" description="Knowledge, lessons, incidents, research, and decisions" />
      <div className="p-8">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({data.entries.length})</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)} ({data.entries.filter((e) => e.category === cat).length})
              </TabsTrigger>
            ))}
          </TabsList>
          {(['all', ...categories] as const).map((tab) => {
            const rows = tab === 'all' ? data.entries : data.entries.filter((e) => e.category === tab);
            return (
              <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
                {rows.map((entry) => (
                  <div key={entry.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{entry.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{entry.summary}</p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {entry.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline">{entry.category}</Badge>
                        <p className="text-xs text-muted-foreground mt-2">{formatDate(entry.recordedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {rows.length === 0 ? <p className="text-muted-foreground">No entries</p> : null}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
