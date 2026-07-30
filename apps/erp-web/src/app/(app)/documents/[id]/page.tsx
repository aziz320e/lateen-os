import { FileText } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { documents } from '@/lib/platform';

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await documents.getDocument(id);

  if (!document) {
    return (
      <div>
        <PageHeader title="Document not found" />
        <EmptyState
          icon={FileText}
          title="No document with this id"
          description="It may have been removed, or the id in the URL is incorrect."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/documents">Back to Documents</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={document.title}
        description={`Type: ${document.documentType}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/documents">Back to Documents</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline">{document.status}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current version</span>
            <span>v{document.currentVersionNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Owner</span>
            <span>{document.ownerId ?? '—'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
