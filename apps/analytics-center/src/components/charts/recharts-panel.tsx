'use client';

import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartData } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['hsl(var(--primary))', '#8884d8', '#82ca9d', '#ffc658'];

function toRechartsData(series: ChartData['series'][0]) {
  return series.data.map((d) => ({ name: d.x, value: d.y }));
}

function ChartBody({ chart, data }: { chart: ChartData; data: { name: string; value: number }[] }) {
  if (chart.type === 'line') {
    return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    );
  }
  if (chart.type === 'bar') {
    return (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  }
  if (chart.type === 'area') {
    return (
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
        <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
      </AreaChart>
    );
  }
  return (
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
      </Pie>
      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
      <Legend />
    </PieChart>
  );
}

export function RechartsPanel({ chart }: { chart: ChartData }) {
  const data = chart.series[0] ? toRechartsData(chart.series[0]) : [];

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{chart.title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ChartBody chart={chart} data={data} />
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
