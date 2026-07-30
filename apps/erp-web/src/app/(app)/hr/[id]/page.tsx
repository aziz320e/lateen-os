import { UsersRound } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { hr } from '@/lib/platform';

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await hr.getEmployee(id);

  if (!employee) {
    return (
      <div>
        <PageHeader title="Employee not found" />
        <EmptyState
          icon={UsersRound}
          title="No employee with this id"
          description="It may have been removed, or the id in the URL is incorrect."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/hr">Back to HR</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description={`Employee #${employee.employeeNumber}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/hr">Back to HR</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{employee.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{employee.phone ?? '—'}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Employment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={employee.employmentStatus === 'active' ? 'success' : 'outline'}>
                {employee.employmentStatus}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{employee.employmentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hire date</span>
              <span>{employee.hireDate}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
