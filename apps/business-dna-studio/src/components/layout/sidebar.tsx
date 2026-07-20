'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Building2,
  Cpu,
  Dna,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  Network,
  Package,
  PenTool,
  Shield,
  Users,
  Workflow,
} from 'lucide-react';
import { ENTITY_DEFINITIONS, EDITOR_ROUTES } from '@/lib/entities';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  organization: Building2,
  branches: GitBranch,
  departments: Users,
  employees: Users,
  roles: Shield,
  permissions: Shield,
  customers: Users,
  suppliers: Package,
  products: Package,
  services: Package,
  machines: Cpu,
  projects: FolderKanban,
  policies: Shield,
  workflows: Workflow,
  kpis: LayoutDashboard,
  assets: Package,
  agents: Bot,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-72 flex-col border-r bg-card/40 overflow-y-auto">
      <div className="flex items-center gap-3 border-b px-6 py-5 sticky top-0 bg-card/95 backdrop-blur z-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
          <Dna className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">Business DNA Studio</p>
          <p className="text-xs text-muted-foreground">Operating System Editor</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        <Section title="Overview">
          <NavLink href="/" label="Dashboard" icon={LayoutDashboard} active={pathname === '/'} />
        </Section>

        <Section title="Business DNA">
          {ENTITY_DEFINITIONS.map((entity) => (
            <NavLink
              key={entity.key}
              href={entity.key === 'organization' ? '/organization' : `/entities/${entity.key}`}
              label={entity.label}
              icon={iconMap[entity.key] ?? Package}
              active={pathname.includes(entity.key)}
            />
          ))}
          <NavLink href="/entities/capabilities" label="Capabilities" icon={Network} active={pathname.includes('capabilities')} />
        </Section>

        <Section title="Visual Editors">
          {EDITOR_ROUTES.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} icon={PenTool} active={pathname === href} />
          ))}
        </Section>
      </nav>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
