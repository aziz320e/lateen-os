/**
 * Scenario 9 — a delivered project handing off into Customer Success,
 * composed only through each engine's own real, public runtime API:
 *
 *   Project (linked to a real seeded CRM customer via its own
 *   `customerId` field) -> Tasks (created, readied, started, completed)
 *   -> Budget (created, cost recorded, closed)
 *   -> Completion (the project itself transitions to `completed`)
 *   -> Customer Success (a real record onboarded for that same customer
 *      id, progressed through activation into adoption).
 *
 * Project Management Engine has no direct dependency on Customer
 * Success Engine (see its own `relationship-management/types.ts` —
 * Customer Success is not among its injected collaborators), so this
 * hand-off is the scenario itself bridging the two engines through the
 * project's own public `customerId` field — the same loosely-coupled,
 * opaque-foreign-key pattern used everywhere else on this platform.
 */
import { describe, expect, it } from 'vitest';
import { createSeededWorld } from './business-fixtures.js';

describe('Scenario 9: Project -> Tasks -> Budget -> Completion -> Customer Success', () => {
  it('delivers a project end to end and hands the customer off into Customer Success', async () => {
    const world = await createSeededWorld();
    const { organizationId, project, runtimes } = world;
    const { projects, customerSuccess } = runtimes;
    if (!project.customerId) throw new Error('seeded project must reference a customer');

    // --- Project starts ---
    const started = await projects.projects.start(organizationId, project.id);
    expect(started.status).toBe('active');

    // --- Tasks ---
    const designTask = await projects.tasks.create(organizationId, {
      projectId: project.id,
      title: 'Finalize channel-letter design proofs',
      priority: 'high',
      estimatedHours: 12,
    });
    await projects.tasks.markReady(organizationId, designTask.id);
    await projects.tasks.start(organizationId, designTask.id);
    const designCompleted = await projects.tasks.complete(organizationId, designTask.id);
    expect(designCompleted.status).toBe('completed');

    const installTask = await projects.tasks.create(organizationId, {
      projectId: project.id,
      title: 'Install signage at all 6 storefronts',
      priority: 'high',
      estimatedHours: 40,
      dependsOnTaskIds: [designTask.id],
    });
    await projects.tasks.markReady(organizationId, installTask.id);
    await projects.tasks.start(organizationId, installTask.id);
    const installCompleted = await projects.tasks.complete(organizationId, installTask.id);
    expect(installCompleted.status).toBe('completed');

    // --- Budget ---
    const budget = await projects.budgets.createBudget(organizationId, {
      projectId: project.id,
      currency: 'USD',
      plannedBudget: '18000.00',
    });
    await projects.budgets.recordCost(organizationId, budget.id, '4500.00');
    const afterInstallCost = await projects.budgets.recordCost(
      organizationId,
      budget.id,
      '9800.00',
    );
    expect(Number(afterInstallCost.actualCost)).toBeCloseTo(14300, 2);
    const remaining = await projects.budgets.getRemainingBudget(organizationId, budget.id);
    expect(Number(remaining)).toBeCloseTo(3700, 2);

    // --- Completion ---
    const completed = await projects.projects.complete(organizationId, project.id);
    expect(completed.status).toBe('completed');
    await projects.budgets.close(organizationId, budget.id);

    // --- Customer Success hand-off ---
    const csRecord = await customerSuccess.customers.onboard(organizationId, {
      customerId: project.customerId,
      ownerId: world.employees[0]?.id,
    });
    expect(csRecord.status).toBe('onboarding');
    expect(csRecord.customerId).toBe(project.customerId);

    const activated = await customerSuccess.customers.activate(organizationId, csRecord.id);
    expect(activated.status).toBe('activation');
    const adopted = await customerSuccess.customers.progressToAdoption(organizationId, csRecord.id);
    expect(adopted.status).toBe('adoption');

    const { records, total } = await customerSuccess.queries.findCustomers({ organizationId });
    expect(total).toBeGreaterThan(0);
    expect(records.some((record) => record.id === csRecord.id)).toBe(true);
  });
});
