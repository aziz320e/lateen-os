'use client';

import type { ChartPayload, TablePayload } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function ChatChart({ chart }: { chart: ChartPayload }) {
  return (
    <div className="mt-3 rounded-lg border bg-background/50 p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">{chart.title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chart.data}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChatTable({ table }: { table: TablePayload }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border">
      <p className="px-3 py-2 text-xs font-medium border-b bg-muted/30">{table.title}</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/20">
            {table.headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChatCodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border bg-black/40 p-3 text-xs font-mono">
      <code>{code}</code>
    </pre>
  );
}
