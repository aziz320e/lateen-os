'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Footer } from './footer';
import { cn } from '@/lib/utils';

export function Shell({
  children,
  userLabel,
  permissions,
}: {
  children: ReactNode;
  userLabel: string | null;
  permissions: readonly string[];
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar permissions={permissions} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className={cn('absolute inset-y-0 left-0')}>
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} permissions={permissions} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileMenuOpen(true)} userLabel={userLabel} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
