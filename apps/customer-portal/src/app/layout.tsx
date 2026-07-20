import type { Metadata } from 'next';
import { Providers } from '@/providers/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Customer Portal | Lateen OS',
  description: 'Secure customer access to projects, orders, quotations, and invoices',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
