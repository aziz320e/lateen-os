/** Persistence adapter — HR Engine (Employee). Reads via `queries.findEmployees()`; writes a durable copy to Postgres. */
import type { PrismaClient } from '@prisma/client';
import type { HrRuntime } from '@lateen-os/hr-engine';

export async function mirrorEmployees(
  prisma: PrismaClient,
  runtime: HrRuntime,
  organizationId: string,
): Promise<void> {
  const { employees } = await runtime.queries.findEmployees({ organizationId });
  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { id: employee.id },
      create: {
        id: employee.id,
        organizationId,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        employmentType: employee.employmentType,
        employmentStatus: employee.employmentStatus,
      },
      update: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        employmentStatus: employee.employmentStatus,
      },
    });
  }
}

export function subscribeHr(
  prisma: PrismaClient,
  runtime: HrRuntime,
  organizationId: string,
): void {
  runtime.events.subscribe(
    'employee.hired',
    () => void mirrorEmployees(prisma, runtime, organizationId),
  );
  runtime.events.subscribe(
    'employee.promoted',
    () => void mirrorEmployees(prisma, runtime, organizationId),
  );
  runtime.events.subscribe(
    'employee.terminated',
    () => void mirrorEmployees(prisma, runtime, organizationId),
  );
  runtime.events.subscribe(
    'employee.transferred',
    () => void mirrorEmployees(prisma, runtime, organizationId),
  );
}
