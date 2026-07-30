import { Boxes } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { inventory } from '@/lib/platform';
import type { InventoryItem } from '@/lib/platform/types';

const columns: DataTableColumn<InventoryItem>[] = [
  { key: 'sku', header: 'SKU', render: (item) => item.sku },
  { key: 'name', header: 'Name', render: (item) => item.name },
  { key: 'unitOfMeasure', header: 'Unit', render: (item) => item.unitOfMeasure },
  {
    key: 'status',
    header: 'Status',
    render: (item) => (
      <Badge variant={item.status === 'active' ? 'success' : 'outline'}>{item.status}</Badge>
    ),
  },
];

export default async function InventoryPage() {
  const { items, total } = await inventory.listItems({ limit: 50 });

  return (
    <div>
      <PageHeader
        title="Inventory"
        description={`${total} item${total === 1 ? '' : 's'} in the catalog.`}
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No items yet"
          description="Items created through the Inventory engine will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          getRowId={(item) => item.id}
          getRowHref={(item) => `/inventory/${item.id}`}
        />
      )}
    </div>
  );
}
