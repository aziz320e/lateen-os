'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { runDiscovery } from '@/lib/api/client';

export function RunDiscoveryDialog() {
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState('signage, vehicle wrap, led board');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      runDiscovery(
        keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries();
      setOpen(false);
    },
  });

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Play className="h-4 w-4" />
        Run Discovery
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Run Product Discovery</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI Product Manager will discover manufacturable opportunities and submit recommendations to the Decision Engine.
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="keywords">Keywords (comma-separated)</Label>
          <Input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="signage, vehicle wrap"
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Running…' : 'Start Discovery'}
          </Button>
        </div>
        {mutation.isError ? (
          <p className="mt-3 text-sm text-destructive">{(mutation.error as Error).message}</p>
        ) : null}
      </div>
    </div>
  );
}
