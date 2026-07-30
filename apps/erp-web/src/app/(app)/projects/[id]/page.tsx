import { Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { projects } from '@/lib/platform';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await projects.getProject(id);

  if (!project) {
    return (
      <div>
        <PageHeader title="Project not found" />
        <EmptyState
          icon={Briefcase}
          title="No project with this id"
          description="It may have been removed, or the id in the URL is incorrect."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/projects">Back to Projects</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        description={`Code: ${project.code}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/projects">Back to Projects</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start date</span>
              <span>{project.startDate ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target end date</span>
              <span>{project.targetEndDate ?? '—'}</span>
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
              <Badge variant="outline">{project.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description</span>
              <span>{project.description ?? '—'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
