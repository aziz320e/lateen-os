import { randomUUID } from 'node:crypto';
import { LAUNCH_PRODUCT_STAGES, nextStageCode } from './stages.js';
import { LAUNCH_PRODUCT_EVENT_NAMES, createMissionEvent } from './events.js';
import { ESCALATION_RULES, RETRY_RULES } from './rules.js';
import {
  DEFAULT_ORG_ID,
  MISSION_CODE,
  MISSION_TITLE,
  type LaunchProductMissionEvent,
  type LaunchProductMissionOutputs,
  type LaunchProductMissionState,
  type LaunchProductSimulationInput,
  type LaunchProductSimulationResult,
  type LaunchProductStageState,
  type LaunchProductStageStatus,
  type SimulationScenario,
} from './types.js';

function initialStages(): LaunchProductStageState[] {
  return LAUNCH_PRODUCT_STAGES.map((s) => ({
    code: s.code,
    name: s.name,
    status: 'pending' as LaunchProductStageStatus,
    workerRole: s.workerRole,
    attempts: 0,
  }));
}

function computeHealth(
  stages: readonly LaunchProductStageState[],
  status: LaunchProductMissionState['status'],
): LaunchProductMissionState['health'] {
  if (status === 'failed') return 'critical';
  if (status === 'escalated') return 'at_risk';
  const failed = stages.some((s) => s.status === 'failed');
  const escalated = stages.some((s) => s.status === 'escalated');
  if (failed) return 'critical';
  if (escalated) return 'at_risk';
  return 'healthy';
}

function buildOutputs(title: string, approved: boolean): LaunchProductMissionOutputs {
  if (!approved) return {};
  return {
    approvedProduct: { title, code: 'LP-' + title.slice(0, 8).toUpperCase().replace(/\s/g, '-'), manufacturable: true },
    marketingPlan: { summary: `Go-to-market plan for ${title}`, channels: ['digital', 'retail', 'b2b'] },
    pricingRecommendation: { unitPrice: '49.99', marginPercent: '32.5' },
    productionPlan: { summary: 'Phased manufacturing rollout', machineIds: ['machine-001', 'machine-002'] },
    capabilityReport: { overallScore: '0.82', gaps: [] },
    decisionRecord: { decisionId: randomUUID(), status: 'approved', title: `Launch ${title}` },
    memoryEntry: { entryId: randomUUID(), summary: `Approved product launch: ${title}` },
  };
}

interface StageOutcome {
  status: LaunchProductStageStatus;
  errorMessage?: string;
  escalate?: boolean;
  reject?: boolean;
}

function resolveStageOutcome(
  stageCode: string,
  scenario: SimulationScenario,
  attempt: number,
): StageOutcome {
  switch (scenario) {
    case 'happy_path':
      return { status: 'completed' };

    case 'escalation_path':
      if (stageCode === 'marketing_review') return { status: 'escalated', escalate: true, errorMessage: 'Marketing rejected positioning' };
      if (stageCode === 'consensus') return { status: 'completed' };
      return { status: 'completed' };

    case 'rejected_path':
      if (stageCode === 'decision_engine') return { status: 'failed', reject: true, errorMessage: 'Decision Engine rejected recommendation' };
      return { status: 'completed' };

    case 'retry_path':
      if (stageCode === 'product_discovery' && attempt === 1) {
        return { status: 'failed', errorMessage: 'Transient discovery service error' };
      }
      return { status: 'completed' };

    default:
      return { status: 'completed' };
  }
}

function shouldRetry(stageCode: string, attempt: number, scenario: SimulationScenario): boolean {
  if (scenario !== 'retry_path') return false;
  const rule = RETRY_RULES.find((r) => r.stageCode === stageCode);
  return rule ? attempt < rule.maxAttempts : false;
}

/** In-memory mission simulator — no persistence, integrates platform contracts conceptually. */
export function simulateLaunchProductMission(
  input: LaunchProductSimulationInput = {},
): LaunchProductSimulationResult {
  const missionId = randomUUID();
  const organizationId = input.organizationId ?? DEFAULT_ORG_ID;
  const opportunityTitle = input.opportunityTitle ?? 'Smart Home Air Purifier';
  const scenario = input.scenario ?? 'happy_path';
  const now = new Date().toISOString();

  const events: LaunchProductMissionEvent[] = [];
  let stages = initialStages();
  let currentStage: LaunchProductMissionState['currentStage'] = 'trend_detected';
  let missionStatus: LaunchProductMissionState['status'] = 'active';
  let consensusReached = false;
  let decisionApproved = false;
  let completedAt: string | undefined;

  events.push(
    createMissionEvent(LAUNCH_PRODUCT_EVENT_NAMES.MissionStarted, missionId, {
      organizationId,
      scenario,
      opportunityTitle,
    }),
  );

  stageLoop: for (const stageDef of LAUNCH_PRODUCT_STAGES) {
    currentStage = stageDef.code;
    let attempt = 0;
    let stageComplete = false;

    while (!stageComplete) {
      attempt += 1;
      const startedAt = new Date().toISOString();

      stages = stages.map((s) =>
        s.code === stageDef.code
          ? { ...s, status: 'running' as const, attempts: attempt, startedAt }
          : s,
      );

      const outcome = resolveStageOutcome(stageDef.code, scenario, attempt);

      if (outcome.status === 'failed' && shouldRetry(stageDef.code, attempt, scenario)) {
        stages = stages.map((s) =>
          s.code === stageDef.code ? { ...s, status: 'pending' as const, errorMessage: outcome.errorMessage } : s,
        );
        continue;
      }

      if (outcome.escalate) {
        missionStatus = 'escalated';
        stages = stages.map((s) =>
          s.code === stageDef.code
            ? { ...s, status: 'escalated' as const, completedAt: new Date().toISOString(), errorMessage: outcome.errorMessage }
            : s,
        );
        const rule = ESCALATION_RULES.find((r) => r.fromStage === stageDef.code);
        events.push(
          createMissionEvent(LAUNCH_PRODUCT_EVENT_NAMES.MissionEscalated, missionId, {
            reason: outcome.errorMessage,
            escalateTo: rule?.escalateTo ?? 'ceo_ai',
          }, stageDef.code),
        );
        stageComplete = true;
        if (stageDef.code !== 'marketing_review') continue;
        missionStatus = 'active';
        stages = stages.map((s) =>
          s.code === stageDef.code ? { ...s, status: 'completed' as const } : s,
        );
        events.push(
          createMissionEvent(LAUNCH_PRODUCT_EVENT_NAMES.MissionStageCompleted, missionId, { attempt }, stageDef.code),
        );
        continue;
      }

      if (outcome.reject) {
        missionStatus = 'failed';
        stages = stages.map((s) =>
          s.code === stageDef.code
            ? { ...s, status: 'failed' as const, completedAt: new Date().toISOString(), errorMessage: outcome.errorMessage }
            : s,
        );
        break stageLoop;
      }

      const finalStatus: LaunchProductStageStatus = outcome.status === 'escalated' ? 'completed' : outcome.status;
      stages = stages.map((s) =>
        s.code === stageDef.code
          ? { ...s, status: finalStatus, completedAt: new Date().toISOString(), errorMessage: outcome.errorMessage }
          : s,
      );

      events.push(
        createMissionEvent(LAUNCH_PRODUCT_EVENT_NAMES.MissionStageCompleted, missionId, { attempt }, stageDef.code),
      );

      if (stageDef.code === 'consensus') {
        consensusReached = true;
        events.push(
          createMissionEvent(LAUNCH_PRODUCT_EVENT_NAMES.ConsensusReached, missionId, {
            agreementScore: scenario === 'escalation_path' ? '0.75' : '0.88',
          }, stageDef.code),
        );
      }

      if (stageDef.code === 'decision_engine' && finalStatus === 'completed') {
        decisionApproved = true;
        events.push(
          createMissionEvent(LAUNCH_PRODUCT_EVENT_NAMES.DecisionApproved, missionId, {
            decisionId: randomUUID(),
          }, stageDef.code),
        );
      }

      stageComplete = true;
    }
  }

  if (missionStatus === 'active' || missionStatus === 'escalated') {
    const allDone = stages.every((s) => s.status === 'completed' || s.status === 'skipped');
    if (allDone && stages[stages.length - 1]?.code === 'workflow_completed') {
      missionStatus = 'completed';
      completedAt = new Date().toISOString();
      events.push(
        createMissionEvent(LAUNCH_PRODUCT_EVENT_NAMES.MissionCompleted, missionId, {
          opportunityTitle,
          outputsGenerated: true,
        }),
      );
    }
  }

  const outputs = buildOutputs(opportunityTitle, missionStatus === 'completed' && decisionApproved);

  const mission: LaunchProductMissionState = {
    id: missionId,
    organizationId,
    code: MISSION_CODE,
    title: MISSION_TITLE,
    status: missionStatus,
    scenario,
    currentStage,
    stages,
    consensusReached,
    decisionApproved,
    health: computeHealth(stages, missionStatus),
    events,
    outputs,
    startedAt: now,
    completedAt,
  };

  return { mission };
}

/** Advance mission one stage (for step-by-step UI simulation). */
export function getMissionProgress(mission: LaunchProductMissionState): number {
  const completed = mission.stages.filter((s) => s.status === 'completed').length;
  return Math.round((completed / mission.stages.length) * 100);
}

export { nextStageCode };
