export type DiscoveryRunStatus =
  | 'pending'
  | 'collecting_signals'
  | 'normalizing'
  | 'ranking'
  | 'matching_capabilities'
  | 'estimating_profit'
  | 'submitting_decision'
  | 'producing_recommendation'
  | 'completed'
  | 'failed';

export interface DiscoveryRecommendation {
  id: string;
  organizationId: string;
  status: 'draft' | 'ready' | 'submitted' | 'approved' | 'rejected';
  rationale: string;
  capabilityMatch: {
    overallMatchScore: string;
    manufacturable: boolean;
    matchedCapabilities: { label: string; matchScore: string }[];
  };
  profitEstimate: {
    estimatedMarginPercent: string;
    projectedMonthlyProfit: string;
    currency: string;
  };
  recommendationCandidate: { id: string; title: string; score: string; summary: string };
  createdAt: string;
  updatedAt: string;
}

export interface ProductDiscoveryRun {
  id: string;
  organizationId: string;
  status: DiscoveryRunStatus;
  currentStage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface DecisionRecord {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting';
  recommendationId: string;
  confidence: string;
  risk: 'low' | 'medium' | 'high';
  policy?: string;
  updatedAt: string;
}

export interface AiWorkerView {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'offline';
  currentTask?: string;
  productivity: number;
  performance: number;
  team?: string;
}

export interface WorkflowView {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStep: string;
  progress: number;
  startedAt: string;
}

export interface MemoryEntryView {
  id: string;
  category: 'knowledge' | 'lesson' | 'incident' | 'research' | 'decision';
  title: string;
  summary: string;
  recordedAt: string;
  tags: string[];
}

export interface ServiceHealth {
  name: string;
  url: string;
  status: 'ok' | 'degraded' | 'down';
  detail?: string;
  category: 'service' | 'infrastructure' | 'data';
}

export interface PlatformHealthSnapshot {
  status: 'ok' | 'degraded' | 'down';
  checkedAt: string;
  services: ServiceHealth[];
}

export interface NotificationItem {
  id: string;
  type: 'mission' | 'decision' | 'risk' | 'ai';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface EntityCounts {
  branches: number;
  departments: number;
  employees: number;
  products: number;
  machines: number;
  agents: number;
  customers: number;
  projects: number;
  workflows: number;
  policies: number;
}

export interface ExecutiveDashboard {
  organization: { id: string; name: string } | null;
  counts: EntityCounts;
  health: PlatformHealthSnapshot;
  missions: import('@lateen-os/launch-product-mission/client').LaunchProductMissionState[];
  missionSummary: {
    activeMissions: number;
    completedMissions: number;
    escalatedMissions: number;
    failedMissions: number;
    averageProgress: number;
    latestMission: import('@lateen-os/launch-product-mission/client').LaunchProductMissionState | null;
  };
  decisions: DecisionRecord[];
  recommendations: DiscoveryRecommendation[];
  runs: ProductDiscoveryRun[];
  workers: AiWorkerView[];
  workflows: WorkflowView[];
  memory: MemoryEntryView[];
  notifications: NotificationItem[];
  finance: {
    projectedRevenue: string;
    projectedMargin: string;
    openInvoices: number;
  };
  risk: {
    openRisks: number;
    highRiskDecisions: number;
    escalatedMissions: number;
  };
}
