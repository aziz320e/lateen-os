'use client';

import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { PageHeader } from '@/components/layout/portal-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton, EmptyState } from '@/components/ui/state';
import { fetchFiles } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';

export default function FilesPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, refetch } = useQuery({ queryKey: ['files'], queryFn: fetchFiles });

  async function handleUpload(file: File) {
    const form = new FormData();
    form.append('file', file);
    await fetch('/api/files', { method: 'POST', body: form, credentials: 'include' });
    refetch();
  }

  return (
    <div>
      <PageHeader title="Files" description="Contracts, designs, proofs, and documents" />
      <div className="p-6 md:p-8 space-y-4">
        <div className="flex gap-2">
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          <Button onClick={() => inputRef.current?.click()}>Upload</Button>
        </div>
        {isLoading ? <Skeleton className="h-64" /> : !data?.files.length ? (
          <EmptyState title="No files" description="Upload a document or wait for shared files." />
        ) : (
          <div className="rounded-lg border divide-y">
            {data.files.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(f.uploadedAt)} · v{f.version} · {f.sizeLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{f.category}</Badge>
                  <Button size="sm" variant="ghost">Preview</Button>
                  <Button size="sm" variant="ghost">Download</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
