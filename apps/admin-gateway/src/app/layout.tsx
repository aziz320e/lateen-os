import type { Metadata } from 'next';
import { Providers } from '@/providers/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Admin Gateway | Lateen OS',
  description: 'Enterprise API Gateway administration console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
