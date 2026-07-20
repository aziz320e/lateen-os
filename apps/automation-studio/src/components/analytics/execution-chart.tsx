'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AutomationAnalytics } from '@/lib/types/automation';

export function ExecutionChart({ data }: { data: AutomationAnalytics['dailyExecutions'] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...data]}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
