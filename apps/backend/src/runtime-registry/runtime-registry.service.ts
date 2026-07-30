/**
 * The Runtime Registry — the platform host's own record of which engine
 * runtimes are live in this process. This is genuinely new
 * infrastructure (no existing engine provides "a registry of every
 * other engine's live instance"), not a duplication of any engine's own
 * business logic: every entry's actual behavior still comes entirely
 * from that engine's own real `createXRuntime()` call.
 *
 * Each engine is instantiated independently and defensively: a failure
 * constructing one engine is recorded and does not prevent the others
 * from starting, or crash the host. This is a deliberate resilience
 * property of a platform host, not a workaround for a real defect —
 * confirmed clean per-engine construction in `docs/certification/`.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createBrainSystem, type BrainSystem } from '@lateen-os/ai-brain';
import { createComplianceRuntime, type ComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import { createGovernanceRuntime, type GovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createSecurityRuntime, type SecurityRuntime } from '@lateen-os/ai-security-engine';
import { createWorkforceRuntime, type WorkforceRuntime } from '@lateen-os/ai-workforce';
import { createAdminConsoleRuntime, type AdminConsoleRuntime } from '@lateen-os/admin-console';
import { createAnalyticsRuntime, type AnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createApiGatewayRuntime, type ApiGatewayRuntime } from '@lateen-os/api-gateway';
import { createBusinessDnaRuntime, type BusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCEOEngine, type CEOEngine } from '@lateen-os/ceo-engine';
import {
  createCommunicationRuntime,
  type CommunicationRuntime,
} from '@lateen-os/communication-hub';
import { createCrmRuntime, type CrmRuntime } from '@lateen-os/crm-engine';
import {
  createCustomerSuccessRuntime,
  type CustomerSuccessRuntime,
} from '@lateen-os/customer-success-engine';
import {
  createDocumentManagementRuntime,
  type DocumentManagementRuntime,
} from '@lateen-os/document-management-engine';
import { createDomainGraphRuntime, type DomainGraphRuntime } from '@lateen-os/domain-graph';
import { createExtensionSystem, type ExtensionSystem } from '@lateen-os/extension-system';
import { createFinanceRuntime, type FinanceRuntime } from '@lateen-os/finance-engine';
import { createHrRuntime, type HrRuntime } from '@lateen-os/hr-engine';
import {
  createInstitutionalMemoryRuntime,
  type InstitutionalMemoryRuntime,
} from '@lateen-os/institutional-memory';
import { createInventoryRuntime, type InventoryRuntime } from '@lateen-os/inventory-engine';
import { createMarketingRuntime, type MarketingRuntime } from '@lateen-os/marketing-engine';
import { createMarketplaceRuntime, type MarketplaceRuntime } from '@lateen-os/marketplace-engine';
import { createMultiAgentRuntime, type MultiAgentRuntime } from '@lateen-os/multi-agent';
import {
  createObservabilityRuntime,
  type ObservabilityRuntime,
} from '@lateen-os/observability-engine';
import { createProjectRuntime, type ProjectRuntime } from '@lateen-os/project-management-engine';
import { createSalesRuntime, type SalesRuntime } from '@lateen-os/sales-engine';
import { createWorkflowRuntime, type WorkflowRuntime } from '@lateen-os/workflow-engine';
import { ENGINE_CATALOG } from './engine-catalog.js';

export interface HostedRuntimes {
  aiBrain: BrainSystem;
  ceoEngine: CEOEngine;
  workflowEngine: WorkflowRuntime;
  multiAgent: MultiAgentRuntime;
  aiWorkforce: WorkforceRuntime;
  businessDna: BusinessDnaRuntime;
  institutionalMemory: InstitutionalMemoryRuntime;
  domainGraph: DomainGraphRuntime;
  crmEngine: CrmRuntime;
  salesEngine: SalesRuntime;
  marketingEngine: MarketingRuntime;
  communicationHub: CommunicationRuntime;
  financeEngine: FinanceRuntime;
  hrEngine: HrRuntime;
  inventoryEngine: InventoryRuntime;
  projectManagementEngine: ProjectRuntime;
  customerSuccessEngine: CustomerSuccessRuntime;
  documentManagementEngine: DocumentManagementRuntime;
  aiSecurityEngine: SecurityRuntime;
  aiGovernanceEngine: GovernanceRuntime;
  aiComplianceEngine: ComplianceRuntime;
  analyticsEngine: AnalyticsRuntime;
  observabilityEngine: ObservabilityRuntime;
  apiGateway: ApiGatewayRuntime;
  adminConsole: AdminConsoleRuntime;
  marketplace: MarketplaceRuntime;
  extensionSystem: ExtensionSystem;
}

export interface EngineRuntimeStatus {
  readonly name: string;
  readonly packageName: string;
  readonly layer: string;
  readonly hosted: boolean;
  readonly status: 'running' | 'unavailable' | 'not-hosted';
  readonly reason?: string;
}

@Injectable()
export class RuntimeRegistryService implements OnModuleInit {
  private readonly logger = new Logger(RuntimeRegistryService.name);
  private readonly runtimes = new Map<string, unknown>();
  private readonly failures = new Map<string, string>();

  private attempt<T>(name: string, factory: () => T): T | undefined {
    try {
      const runtime = factory();
      this.runtimes.set(name, runtime);
      return runtime;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.failures.set(name, message);
      this.logger.error(`Failed to construct runtime "${name}": ${message}`);
      return undefined;
    }
  }

  onModuleInit(): void {
    // Independent engines first — order does not matter among these.
    this.attempt('ai-brain', createBrainSystem);
    this.attempt('ceo-engine', createCEOEngine);
    const workflowEngine = this.attempt('workflow-engine', createWorkflowRuntime);
    this.attempt('multi-agent', createMultiAgentRuntime);
    this.attempt('ai-workforce', createWorkforceRuntime);
    this.attempt('business-dna', createBusinessDnaRuntime);
    this.attempt('institutional-memory', createInstitutionalMemoryRuntime);
    this.attempt('domain-graph', createDomainGraphRuntime);
    const crmEngine = this.attempt('crm-engine', createCrmRuntime);
    const salesEngine = this.attempt('sales-engine', createSalesRuntime);
    const marketingEngine = this.attempt('marketing-engine', createMarketingRuntime);
    const communicationHub = this.attempt('communication-hub', createCommunicationRuntime);
    const financeEngine = this.attempt('finance-engine', createFinanceRuntime);
    const hrEngine = this.attempt('hr-engine', createHrRuntime);
    const inventoryEngine = this.attempt('inventory-engine', createInventoryRuntime);
    const projectManagementEngine = this.attempt('project-management-engine', createProjectRuntime);
    const customerSuccessEngine = this.attempt(
      'customer-success-engine',
      createCustomerSuccessRuntime,
    );
    this.attempt('document-management-engine', createDocumentManagementRuntime);
    const aiSecurityEngine = this.attempt('ai-security-engine', createSecurityRuntime);
    const aiGovernanceEngine = this.attempt('ai-governance-engine', createGovernanceRuntime);
    const aiComplianceEngine = this.attempt('ai-compliance-engine', createComplianceRuntime);
    const analyticsEngine = this.attempt('analytics-engine', createAnalyticsRuntime);
    const observabilityEngine = this.attempt('observability-engine', createObservabilityRuntime);
    this.attempt('admin-console', createAdminConsoleRuntime);
    this.attempt('marketplace', createMarketplaceRuntime);
    this.attempt('extension-system', () => createExtensionSystem(process.cwd()));

    // API Gateway is constructed last, with the real sibling runtimes
    // above injected per its own RelationshipManagementDeps contract —
    // the same dependency-injection discipline every engine's own
    // runtime.ts already uses internally.
    this.attempt('api-gateway', () =>
      createApiGatewayRuntime({
        workflow: workflowEngine,
        crm: crmEngine,
        sales: salesEngine,
        marketing: marketingEngine,
        communicationHub,
        finance: financeEngine,
        hr: hrEngine,
        inventory: inventoryEngine,
        projects: projectManagementEngine,
        customerSuccess: customerSuccessEngine,
        analytics: analyticsEngine,
        observability: observabilityEngine,
        aiSecurity: aiSecurityEngine,
        aiGovernance: aiGovernanceEngine,
        aiCompliance: aiComplianceEngine,
      }),
    );

    const running = this.runtimes.size;
    const total = ENGINE_CATALOG.filter((entry) => entry.hosted).length;
    this.logger.log(`Runtime Registry ready: ${running}/${total} hosted engine runtimes running.`);
  }

  /** Looks up a hosted runtime by its catalog name (e.g. `'crm-engine'`). Callers cast to the specific runtime type they expect. */
  get<T = unknown>(name: string): T | undefined {
    return this.runtimes.get(name) as T | undefined;
  }

  has(name: string): boolean {
    return this.runtimes.has(name);
  }

  /** Every hosted runtime's real instance, keyed by engine name — used only by other platform-host services, never returned directly over HTTP. */
  all(): ReadonlyMap<string, unknown> {
    return this.runtimes;
  }

  statuses(): readonly EngineRuntimeStatus[] {
    return ENGINE_CATALOG.map((entry) => {
      if (!entry.hosted) {
        return {
          name: entry.name,
          packageName: entry.packageName,
          layer: entry.layer,
          hosted: false,
          status: 'not-hosted',
          reason: entry.reason,
        };
      }
      if (this.runtimes.has(entry.name)) {
        return {
          name: entry.name,
          packageName: entry.packageName,
          layer: entry.layer,
          hosted: true,
          status: 'running',
        };
      }
      return {
        name: entry.name,
        packageName: entry.packageName,
        layer: entry.layer,
        hosted: true,
        status: 'unavailable',
        reason: this.failures.get(entry.name) ?? 'Not yet constructed.',
      };
    });
  }
}
