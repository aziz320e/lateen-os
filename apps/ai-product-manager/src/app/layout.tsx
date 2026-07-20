import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/app-shell';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Product Manager | Lateen OS',
  description: 'Continuously discover profitable manufacturable products',
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
