import type { Metadata } from 'next';
import { Providers } from '@/providers/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Studio | Lateen OS',
  description: 'No-code environment for designing, testing, and deploying AI Workers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
