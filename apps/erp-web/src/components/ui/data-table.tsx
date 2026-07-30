import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  getRowHref?: (row: T) => string;
}

/**
 * A plain, dependency-free table for list pages. Every row comes from a
 * real runtime query result passed in by the caller — this component only
 * renders what it's given, it never fetches or fabricates data itself.
 */
export function DataTable<T>({ columns, rows, getRowId, getRowHref }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = getRowHref?.(row);
            return (
              <tr
                key={getRowId(row)}
                className="border-b border-border last:border-0 hover:bg-secondary/40"
              >
                {columns.map((column, index) =>
                  href && index === 0 ? (
                    <td key={column.key} className={cn('px-4 py-3', column.className)}>
                      <a href={href} className="block text-primary hover:underline">
                        {column.render(row)}
                      </a>
                    </td>
                  ) : (
                    <td key={column.key} className={cn('px-4 py-3', column.className)}>
                      {column.render(row)}
                    </td>
                  ),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
