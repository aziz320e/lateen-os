import type { ReactNode } from 'react';
import { Shell } from '@/components/layout/shell';
import { getCurrentUser, getSessionClaims } from '@/lib/auth/session';

/**
 * Real session data for every page in this route group: the
 * authenticated user's display name (for the header) and their real,
 * backend-issued JWT permissions (for role-based navigation /
 * permission-aware UI in the sidebar). `middleware.ts` has already
 * ensured a session cookie exists before this layout ever renders.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const [user, claims] = await Promise.all([getCurrentUser(), getSessionClaims()]);
  const userLabel = user?.displayName ?? null;
  const permissions = claims?.permissions ?? [];

  return (
    <Shell userLabel={userLabel} permissions={permissions}>
      {children}
    </Shell>
  );
}
