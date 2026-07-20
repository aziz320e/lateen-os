import type { Metadata } from 'next';
import { Providers } from '@/providers/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Setup Wizard | Lateen OS',
  description: 'Enterprise provisioning setup wizard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
