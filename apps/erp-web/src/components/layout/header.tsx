'use client';

import { Menu, LogOut, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  onMenuClick: () => void;
  userLabel: string | null;
}

export function Header({ onMenuClick, userLabel }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {userLabel ? (
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <UserCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <span className="hidden text-sm text-muted-foreground sm:inline">{userLabel}</span>
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="ghost" size="icon" aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <Button asChild size="sm">
            <Link href="/login">Log in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
