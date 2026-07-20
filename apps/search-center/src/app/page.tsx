'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Clock, Loader2, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { executeSearch, fetchIndexes, fetchRecent, fetchSaved } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const MODES = ['keyword', 'semantic', 'hybrid', 'vector', 'metadata', 'graph'] as const;

export default function SearchCenterPage() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<string>('hybrid');
  const [advanced, setAdvanced] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof executeSearch>> | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: recent } = useQuery({ queryKey: ['recent'], queryFn: fetchRecent });
  const { data: saved } = useQuery({ queryKey: ['saved'], queryFn: fetchSaved });
  const { data: indexes } = useQuery({ queryKey: ['indexes'], queryFn: fetchIndexes });

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      setResults(await executeSearch(query, mode));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
      <header className="border-b bg-card/50 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">Lateen OS Search Center</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full rounded-lg border bg-background py-3 pl-10 pr-4"
                placeholder="Search across Business DNA, Knowledge, Memory, Marketplace..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </button>
            <button
              type="button"
              onClick={() => setAdvanced(!advanced)}
              className="rounded-lg border px-3 py-3"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>

          {advanced && (
            <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-3">
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs',
                    mode === m ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </form>

        {results && (
          <section className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {results.total} results · {results.intent} · {results.latencyMs}ms · mode: {results.mode}
            </div>
            {results.hits.map((hit) => (
              <div key={hit.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{hit.title}</h3>
                  <span className="text-xs text-muted-foreground">{hit.source}</span>
                </div>
                {hit.highlights[0] && (
                  <p className="mt-1 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: hit.highlights[0].snippet }} />
                )}
                <div className="mt-2 text-xs text-muted-foreground">Score: {hit.score.toFixed(2)} · {hit.entityType}</div>
              </div>
            ))}
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-primary" /> Recent</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {recent?.slice(0, 5).map((r) => (
                <li key={r.searchedAt} className="cursor-pointer hover:text-foreground" onClick={() => { setQuery(r.query); }}>
                  {r.query} <span className="text-xs">({r.hitCount})</span>
                </li>
              )) ?? <li>No recent searches</li>}
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 font-medium"><Bookmark className="h-4 w-4 text-primary" /> Saved</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {saved?.length ? saved.map((s) => <li key={s.id}>{s.name || s.query}</li>) : <li>No saved searches</li>}
            </ul>
          </section>

          <section className="rounded-lg border bg-card p-4">
            <div className="mb-3 font-medium">Search Analytics</div>
            <div className="text-2xl font-semibold">{indexes?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">Indexed sources</div>
          </section>
        </div>
      </main>
    </div>
  );
}
