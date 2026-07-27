import { describe, expect, it, vi } from 'vitest';
import { createComplianceEventBus } from '../src/events/compliance-event-bus.js';
import { COMPLIANCE_EVENT_NAMES } from '../src/events/compliance-events.js';
import { createComplianceRuntime } from '../src/runtime.js';

describe('COMPLIANCE_EVENT_NAMES', () => {
  it('declares exactly the 11 required event names', () => {
    expect(Object.values(COMPLIANCE_EVENT_NAMES).sort()).toEqual(
      [
        'framework.created',
        'framework.updated',
        'assessment.completed',
        'control.failed',
        'control.passed',
        'evidence.collected',
        'audit.started',
        'audit.completed',
        'remediation.created',
        'remediation.completed',
        'compliance.report.generated',
      ].sort(),
    );
  });
});

describe('createComplianceEventBus', () => {
  it('dispatches to subscribers of the exact event name only', () => {
    const eventBus = createComplianceEventBus();
    const frameworkCreated = vi.fn();
    const auditStarted = vi.fn();
    eventBus.subscribe('framework.created', frameworkCreated);
    eventBus.subscribe('audit.started', auditStarted);

    eventBus.publish('framework.created', { organizationId: 'org-1', frameworkId: 'fw-1', frameworkCode: 'GDPR' });

    expect(frameworkCreated).toHaveBeenCalledTimes(1);
    expect(auditStarted).not.toHaveBeenCalled();
  });
});

describe('end-to-end event flow through createComplianceRuntime()', () => {
  it('every declared event is genuinely published by the real service that causes it', async () => {
    const runtime = createComplianceRuntime();
    const seen: string[] = [];
    for (const eventName of Object.values(COMPLIANCE_EVENT_NAMES)) {
      runtime.events.subscribe(eventName, () => seen.push(eventName));
    }

    const ORG = 'org-1';
    const ASOF = '2026-06-01T00:00:00.000Z';

    const framework = await runtime.frameworks.create(ORG, { frameworkCode: 'GDPR', name: 'g', requiredControlTypes: ['technical'] });
    await runtime.frameworks.update(ORG, framework.id, { name: 'g2' });

    const control = await runtime.controls.create(ORG, { controlType: 'technical', name: 'c', frameworkId: framework.id, implementationStatus: 'implemented' });
    await runtime.controls.approve(ORG, control.id);
    await runtime.evidence.collectEvidence(ORG, { controlId: control.id, source: 'manual' });
    await runtime.assessments.runAssessment(ORG, framework.id, { asOf: ASOF });

    const failingControl = await runtime.controls.create(ORG, { controlType: 'administrative', name: 'c2', frameworkId: framework.id, implementationStatus: 'not_implemented' });
    await runtime.controls.approve(ORG, failingControl.id);
    await runtime.assessments.runAssessment(ORG, framework.id, { asOf: ASOF });

    const audit = await runtime.audits.createAuditPlan(ORG, { title: 'a', frameworkId: framework.id });
    await runtime.audits.startAudit(ORG, audit.id);
    await runtime.audits.completeAudit(ORG, audit.id);

    const remediation = await runtime.remediations.createRemediation(ORG, { title: 'r', frameworkId: framework.id });
    await runtime.remediations.updateStatus(ORG, remediation.id, 'in_progress');
    await runtime.remediations.complete(ORG, remediation.id);

    await runtime.reports.generateReport(ORG, framework.id, { asOf: ASOF });

    await Promise.resolve();

    expect(new Set(seen)).toEqual(new Set(Object.values(COMPLIANCE_EVENT_NAMES)));
  });
});
