import Link from 'next/link';
import { Layers } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';

export function Sidebar({
  onNavigate,
  permissions,
}: {
  onNavigate?: () => void;
  permissions: readonly string[];
}) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <Link href="/dashboard" className="flex items-center gap-2 border-b border-border px-4 py-4">
        <Layers className="h-5 w-5 text-primary" aria-hidden="true" />
        <span className="text-sm font-semibold tracking-tight text-foreground">Lateen ERP</span>
      </Link>
      <SidebarNav onNavigate={onNavigate} permissions={permissions} />
    </div>
  );
}
