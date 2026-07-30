import { Boxes } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { inventory } from '@/lib/platform';

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await inventory.getItem(id);

  if (!item) {
    return (
      <div>
        <PageHeader title="Item not found" />
        <EmptyState
          icon={Boxes}
          title="No item with this id"
          description="It may have been removed, or the id in the URL is incorrect."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/inventory">Back to Inventory</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={item.name}
        description={`SKU: ${item.sku}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/inventory">Back to Inventory</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit of measure</span>
              <span>{item.unitOfMeasure}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description</span>
              <span>{item.description ?? '—'}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={item.status === 'active' ? 'success' : 'outline'}>
                {item.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
