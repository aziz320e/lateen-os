import type { Metadata } from 'next';
import { QueryProvider } from '@/providers/query-provider';
import { AppShell } from '@/components/layout/app-shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lateen Assistant',
  description: 'Unified conversational interface for Lateen OS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
