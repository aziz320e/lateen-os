export type {
  DiscoveryRunRepository,
  SignalRepository,
  OpportunityRepository,
  CapabilityMatchRepository,
  ProfitEstimateRepository,
  RecommendationRepository,
  WorkflowExecutionRepository,
  WorkflowExecutionRecord,
  Repositories,
} from './ports.js';
export { createRepositories } from './prisma-repositories.js';
