/** Persistence adapter — Project Management Engine (Project). Reads via `queries.findProjects()`; writes a durable copy to Postgres. */
import type { PrismaClient } from '@prisma/client';
import type { ProjectRuntime } from '@lateen-os/project-management-engine';

export async function mirrorProjects(
  prisma: PrismaClient,
  runtime: ProjectRuntime,
  organizationId: string,
): Promise<void> {
  const { projects } = await runtime.queries.findProjects({ organizationId });
  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      create: {
        id: project.id,
        organizationId,
        code: project.code,
        name: project.name,
        description: project.description ?? null,
        customerId: project.customerId ?? null,
        status: project.status,
        startDate: project.startDate ? new Date(project.startDate) : null,
        targetEndDate: project.targetEndDate ? new Date(project.targetEndDate) : null,
      },
      update: {
        name: project.name,
        status: project.status,
      },
    });
  }
}

export function subscribeProjectManagement(
  prisma: PrismaClient,
  runtime: ProjectRuntime,
  organizationId: string,
): void {
  runtime.events.subscribe(
    'project.created',
    () => void mirrorProjects(prisma, runtime, organizationId),
  );
  runtime.events.subscribe(
    'project.started',
    () => void mirrorProjects(prisma, runtime, organizationId),
  );
  runtime.events.subscribe(
    'project.completed',
    () => void mirrorProjects(prisma, runtime, organizationId),
  );
  runtime.events.subscribe(
    'project.cancelled',
    () => void mirrorProjects(prisma, runtime, organizationId),
  );
}
