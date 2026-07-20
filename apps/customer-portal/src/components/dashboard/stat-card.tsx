import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

export function StatCard({ title, value, hint, icon: Icon }: { title: string; value: string | number; hint?: string; icon: LucideIcon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
