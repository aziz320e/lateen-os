import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
}

export function StatCard({ label, value, icon: Icon, href }: StatCardProps) {
  const content = (
    <Card className="transition-colors hover:border-primary/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
  return href ? (
    <a href={href} className="block">
      {content}
    </a>
  ) : (
    content
  );
}
