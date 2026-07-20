'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { getOrganization, updateOrganization } from '@/lib/api/client';
import { useState } from 'react';

export default function OrganizationPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
  });

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Organization" />
        <Skeleton className="m-8 h-48" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Organization" />
        <p className="p-8 text-destructive">{(error as Error)?.message ?? 'Organization not found'}</p>
      </div>
    );
  }

  const orgName = String(data.name ?? '');
  const orgCode = String(data.code ?? '');

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      await updateOrganization({
        name: name || orgName,
        code: code || orgCode,
      });
      setMessage('Organization updated');
      refetch();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Organization"
        description="Canonical organization record — the root of Business DNA"
      />

      <div className="p-8 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={orgName} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" defaultValue={orgCode} onChange={(e) => setCode(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">ID: {String(data.id)}</p>
            {message ? <p className="text-sm">{message}</p> : null}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
