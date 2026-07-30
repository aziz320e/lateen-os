import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Real session data only: the signed-in user's profile, roles, and
 * effective permissions come straight from `apps/backend`'s real
 * `GET /auth/me` — nothing here is fabricated.
 */
export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <PageHeader title="Settings" description="Application-level preferences." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Switch between light and dark theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Your real, authenticated session (via the platform backend&apos;s `/auth/me`).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Signed in as</span>
              <span>{user ? `${user.displayName} <${user.email}>` : 'Not signed in'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Roles</span>
              <span>{user && user.roles.length > 0 ? user.roles.join(', ') : '—'}</span>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="text-muted-foreground">Permissions</span>
              <span className="text-right">
                {user && user.permissions.length > 0 ? user.permissions.join(', ') : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
