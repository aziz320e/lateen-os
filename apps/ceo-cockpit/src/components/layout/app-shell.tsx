'use client';

import { Sidebar } from './sidebar';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-end border-b px-6 py-2">
          <NotificationBell />
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
