'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bot,
  CheckSquare,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Sun,
  Factory,
  Bell,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/api/client';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/quotations', label: 'Quotations', icon: FileText },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/production', label: 'Production', icon: Factory },
  { href: '/files', label: 'Files', icon: Package },
  { href: '/approvals', label: 'Approvals', icon: CheckSquare },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/assistant', label: 'AI Assistant', icon: Bot },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r bg-card/50 md:flex md:flex-col">
        <div className="border-b px-6 py-5">
          <p className="font-semibold">Customer Portal</p>
          <p className="text-xs text-muted-foreground">Lateen OS</p>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                pathname === href || pathname.startsWith(`${href}/`)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4 space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            Toggle theme
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b bg-card/30 px-6 py-6 md:px-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
    </div>
  );
}
