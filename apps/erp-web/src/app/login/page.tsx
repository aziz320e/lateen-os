import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Real sign-in — posts directly to `POST /api/auth/login` (a Route
 * Handler), which calls `apps/backend`'s real `POST /auth/login` and
 * relays its cookies. `organizationId` is required because the
 * backend's `User` model is scoped per-organization
 * (`@@unique([organizationId, email])`) — there is no cross-org email
 * lookup endpoint.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Layers className="mb-2 h-8 w-8 text-primary" aria-hidden="true" />
          <CardTitle>Lateen ERP</CardTitle>
          <CardDescription>Sign in with your organization credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error === 'missing-fields' ? 'All fields are required.' : error}
            </div>
          ) : null}
          <form action="/api/auth/login" method="post" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="organizationId" className="text-sm font-medium text-foreground">
                Organization ID
              </label>
              <input
                id="organizationId"
                name="organizationId"
                type="text"
                required
                placeholder="Your organization's id"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
