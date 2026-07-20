'use client';

import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { PageHeader } from '@/components/layout/portal-shell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/state';
import { fetchProfile } from '@/lib/api/client';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });

  return (
    <div>
      <PageHeader title="Settings" description="Profile, theme, and notification preferences" />
      <div className="p-6 md:p-8 max-w-lg space-y-8">
        {isLoading ? <Skeleton className="h-32" /> : (
          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <p className="font-medium">Profile</p>
            <p>{String(data?.user.displayName ?? data?.user.username ?? '—')}</p>
            <p className="text-muted-foreground">{String(data?.user.email ?? '')}</p>
            <p className="text-muted-foreground">Customer: {String((data?.customer as { name?: string })?.name ?? '—')}</p>
          </div>
        )}
        <div className="rounded-lg border p-4 space-y-3">
          <p className="font-medium text-sm">Theme</p>
          <div className="flex gap-2">
            <Button size="sm" variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Light</Button>
            <Button size="sm" variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Dark</Button>
            <Button size="sm" variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')}>System</Button>
          </div>
        </div>
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <p className="font-medium">Notification preferences</p>
          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Project updates</label>
          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Production updates</label>
          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Invoice issued</label>
          <label className="flex items-center gap-2"><input type="checkbox" /> AI recommendations</label>
        </div>
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Password</p>
          <p className="mt-1">Managed via Identity Service. Contact your account administrator to reset.</p>
        </div>
      </div>
    </div>
  );
}
