import { describe, expect, it } from 'vitest';
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createComplianceRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('AI Compliance Engine — real integration with the five public collaborator APIs', () => {
  it('relationships.getSecurityViolationsContext() reflects a real AI Security Engine violation', async () => {
    const security = createSecurityRuntime();
    await security.authentication.validateToken(ORG, 'not-a-real-token');

    const compliance = createComplianceRuntime({ aiSecurity: security });
    const violations = await compliance.relationships.getSecurityViolationsContext(ORG);

    expect(violations).not.toBeNull();
    expect(violations!.some((event) => event.category === 'authentication')).toBe(true);
  });

  it('gapAnalysis.analyze() detects a real, orphaned AI Governance Engine policy', async () => {
    const governance = createGovernanceRuntime();
    const policy = await governance.policies.create(ORG, { name: 'Data Retention Policy', policyType: 'business' });
    await governance.policies.activate(ORG, policy.id);

    const compliance = createComplianceRuntime({ aiGovernance: governance.queries });
    const framework = await compliance.frameworks.create(ORG, { frameworkCode: 'GDPR', name: 'GDPR', requiredControlTypes: [] });

    const gaps = await compliance.gapAnalysis.analyze(ORG, framework.id);
    expect(gaps.orphanedPolicyIds).toContain(policy.id);
  });

  it('gapAnalysis.analyze() does not flag a policy once it is mapped to a control', async () => {
    const governance = createGovernanceRuntime();
    const policy = await governance.policies.create(ORG, { name: 'Access Control Policy', policyType: 'security' });
    await governance.policies.activate(ORG, policy.id);

    const compliance = createComplianceRuntime({ aiGovernance: governance.queries });
    const framework = await compliance.frameworks.create(ORG, { frameworkCode: 'ISO27001', name: 'ISO', requiredControlTypes: [] });
    const control = await compliance.controls.create(ORG, { controlType: 'administrative', name: 'c', frameworkId: framework.id });
    await compliance.controlMappings.mapControl(ORG, { controlId: control.id, mappedType: 'policy', mappedId: policy.id });

    const gaps = await compliance.gapAnalysis.analyze(ORG, framework.id);
    expect(gaps.orphanedPolicyIds).not.toContain(policy.id);
  });

  it('relationships.raiseComplianceWorkflowRequest() starts a real Workflow Engine instance', async () => {
    const workflow = createWorkflowRuntime();
    const compliance = createComplianceRuntime({ workflow });

    const raised = await compliance.relationships.raiseComplianceWorkflowRequest(ORG, { requestType: 'audit_review', notes: 'annual audit' });
    expect(raised).not.toBeNull();

    const found = await workflow.queries.findWorkflow({ organizationId: ORG, definitionId: raised!.workflowDefinitionId });
    expect(found.definition).not.toBeNull();
  });

  it('relationships.notifyComplianceEvent() sends a real Communication Hub notification', async () => {
    const communicationHub = createCommunicationRuntime();
    const compliance = createComplianceRuntime({ communicationHub });

    const notification = await compliance.relationships.notifyComplianceEvent(ORG, { title: 'Assessment failed', body: 'Critical control failure detected' });

    expect(notification).not.toBeNull();
    expect(notification!.notificationType).toBe('escalation');

    const found = await communicationHub.queries.findNotifications({ organizationId: ORG });
    expect(found.notifications.some((n) => n.id === notification!.id)).toBe(true);
  });

  it('relationships.getBusinessProfileContext() reads a real Business DNA business profile', async () => {
    const businessDna = createBusinessDnaRuntime();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Corp',
      legalEntity: { legalName: 'Acme Corporation Ltd.', jurisdiction: 'US-DE' },
    });

    const compliance = createComplianceRuntime({ businessDna });
    const profile = await compliance.relationships.getBusinessProfileContext(ORG);

    expect(profile?.displayName).toBe('Acme Corp');
  });

  it('a single createComplianceRuntime() wires all five real collaborators together at once', async () => {
    const security = createSecurityRuntime();
    const governance = createGovernanceRuntime();
    const businessDna = createBusinessDnaRuntime();
    const workflow = createWorkflowRuntime();
    const communicationHub = createCommunicationRuntime();

    const compliance = createComplianceRuntime({
      aiSecurity: security,
      aiGovernance: governance.queries,
      businessDna,
      workflow,
      communicationHub,
    });

    expect(await compliance.relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await compliance.relationships.getSecurityViolationsContext(ORG)).toEqual([]);

    const framework = await compliance.frameworks.create(ORG, { frameworkCode: 'EU_AI_ACT', name: 'EU AI Act', requiredControlTypes: [] });
    const gaps = await compliance.gapAnalysis.analyze(ORG, framework.id);
    expect(gaps.orphanedPolicyIds).toEqual([]);

    const raised = await compliance.relationships.raiseComplianceWorkflowRequest(ORG, { requestType: 'smoke_test' });
    expect(raised).not.toBeNull();
  });
});
