/** Discovery API response types — mirrors Product Discovery service domain. */

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

export interface MarketSignal {
  signalId: string;
  organizationId: string;
  source: string;
  category: string;
  title: string;
  keyword?: string;
  strength?: string;
  collectedAt: string;
}

export interface RankedOpportunity {
  opportunityId: string;
  title: string;
  compositeScore: string;
  demandScore: string;
  tier: string;
  rank: number;
}

export interface MatchedCapability {
  capabilityId: string;
  label: string;
  available: boolean;
  matchScore: string;
}

export interface CapabilityMatch {
  matchId: string;
  opportunityId: string;
  status: string;
  matchedCapabilities: MatchedCapability[];
  missingCapabilities: string[];
  overallMatchScore: string;
  manufacturable: boolean;
}

export interface ProfitEstimate {
  estimateId: string;
  opportunityId: string;
  currency: string;
  estimatedUnitCost: string;
  estimatedUnitPrice: string;
  estimatedMarginPercent: string;
  estimatedMonthlyVolume: string;
  projectedMonthlyProfit: string;
  confidence: string;
}

export interface RecommendationCandidate {
  id: string;
  title: string;
  summary: string;
  proposedAction: string;
  score: string;
  reasons?: { code: string; summary: string }[];
}

export interface DiscoveryRecommendation {
  id: string;
  organizationId: string;
  status: 'draft' | 'ready' | 'submitted' | 'approved' | 'rejected';
  rationale: string;
  capabilityMatch: CapabilityMatch;
  profitEstimate: ProfitEstimate;
  recommendationCandidate: RecommendationCandidate;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionSubmission {
  decisionId: string;
  title: string;
  summary: string;
  status: 'prepared' | 'submitted' | 'accepted' | 'rejected';
  proposedAction: string;
}

export interface ProductDiscoveryRun {
  id: string;
  organizationId: string;
  status: DiscoveryRunStatus;
  currentStage?: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  collectSignals?: { signals: MarketSignal[]; sourceCounts: Record<string, number> };
  rank?: { opportunities: RankedOpportunity[] };
  capabilityMatching?: { matches: CapabilityMatch[] };
  profitEstimation?: { estimates: ProfitEstimate[] };
  decisionSubmission?: { submission: DecisionSubmission };
  recommendation?: { recommendations: DiscoveryRecommendation[] };
}

export interface AiRuntimeTask {
  id: string;
  title: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  priority: string;
  runtimeAgentId: string;
  createdAt: string;
  updatedAt: string;
  runId?: string;
}

export interface DecisionRecord {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting';
  recommendationId: string;
  confidence: string;
  risk: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

export interface PlatformHealth {
  status: string;
  services: { name: string; status: string; mode?: string }[];
  infrastructure: { name: string; status: string }[];
}
