import type { Metadata } from 'next';
import { Providers } from '@/providers/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lateen Cloud Console',
  description: 'SaaS control plane for Lateen OS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
