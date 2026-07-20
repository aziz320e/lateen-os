'use client';

import { Badge } from '@/components/ui/badge';
import { cn, statusColor } from '@/lib/utils';

export function DataTable({
  columns,
  rows,
  emptyMessage = 'No data',
}: {
  columns: { key: string; label: string; render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode }[];
  rows: Record<string, unknown>[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-medium">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={String(row.id ?? i)} className="border-t">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={cn(statusColor(status))}>{status}</Badge>;
}
