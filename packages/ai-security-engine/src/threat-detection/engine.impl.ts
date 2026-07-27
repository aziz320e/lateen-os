/**
 * Real Threat Detection engine — deterministic pattern-based detection
 * of Prompt Injection, Jailbreak attempts, and Secret Leakage in text,
 * plus deterministic counting-based detection of Tool Abuse and Rate
 * Abuse. No AI/LLM — every detector is a fixed regex or arithmetic
 * rule.
 *
 * @module threat-detection/engine.impl
 */
import type { SecurityEventBus } from '../events/security-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { ThreatRepository } from './repository.js';
import type { Threat, ThreatId, ThreatSeverity } from './types.js';

const INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore (the )?(previous|prior|above) instructions/i,
  /disregard (the )?(previous|prior|above)/i,
  /forget (everything|all) (you were told|above)/i,
  /new instructions\s*:/i,
  /reveal (your |the )?system prompt/i,
];

const JAILBREAK_PATTERNS: readonly RegExp[] = [
  /\bdan mode\b/i,
  /pretend (that )?you('re| are) not an ai/i,
  /bypass your (restrictions|guidelines|rules|filters)/i,
  /act as if you have no (restrictions|rules|filters)/i,
  /\bjailbreak\b/i,
];

const SECRET_LEAKAGE_PATTERNS: readonly RegExp[] = [
  /sk-[a-z0-9]{20,}/i,
  /akia[0-9a-z]{16}/i,
  /-----begin (rsa |ec )?private key-----/i,
  /ghp_[a-z0-9]{30,}/i,
];

function matchesAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/** Pure: deterministic prompt-injection pattern match. */
export function detectPromptInjection(text: string): boolean {
  return matchesAny(text, INJECTION_PATTERNS);
}

/** Pure: deterministic jailbreak-attempt pattern match. */
export function detectJailbreak(text: string): boolean {
  return matchesAny(text, JAILBREAK_PATTERNS);
}

/** Pure: deterministic secret-leakage pattern match (API-key- and private-key-shaped strings). */
export function detectSecretLeakage(text: string): boolean {
  return matchesAny(text, SECRET_LEAKAGE_PATTERNS);
}

/** Pure: every tool id whose recorded execution count meets or exceeds `maxExecutions`. */
export function detectToolAbuse(executionCounts: Readonly<Record<string, number>>, maxExecutions: number): readonly string[] {
  return Object.entries(executionCounts)
    .filter(([, count]) => count >= maxExecutions)
    .map(([toolId]) => toolId)
    .sort();
}

/** Pure: `true` when more than `maxRequests` timestamps fall within the trailing `windowMs` window ending at `asOf`. */
export function detectRateAbuse(timestamps: readonly ISODateTime[], windowMs: number, maxRequests: number, asOf: ISODateTime): boolean {
  const cutoff = new Date(asOf).getTime() - windowMs;
  const inWindow = timestamps.filter((timestamp) => new Date(timestamp).getTime() > cutoff && new Date(timestamp).getTime() <= new Date(asOf).getTime());
  return inWindow.length > maxRequests;
}

export interface ScanPromptInput {
  readonly text: string;
  readonly sourceIdentityId?: string;
}

export interface CheckToolAbuseInput {
  readonly toolId: string;
  readonly executionCounts: Readonly<Record<string, number>>;
  readonly maxExecutions: number;
  readonly sourceIdentityId?: string;
}

export interface CheckRateAbuseInput {
  readonly timestamps: readonly ISODateTime[];
  readonly windowMs: number;
  readonly maxRequests: number;
  readonly asOf?: ISODateTime;
  readonly sourceIdentityId?: string;
}

export interface ThreatDetectionEngine {
  /** Scans text for prompt injection, jailbreak attempts, and secret leakage; records and publishes `prompt.attack.detected` for every match. */
  scanPrompt(organizationId: OrganizationId, input: ScanPromptInput): Promise<readonly Threat[]>;
  checkToolAbuse(organizationId: OrganizationId, input: CheckToolAbuseInput): Promise<Threat | null>;
  checkRateAbuse(organizationId: OrganizationId, input: CheckRateAbuseInput): Promise<Threat | null>;
  getThreat(organizationId: OrganizationId, threatId: ThreatId): Promise<Threat | null>;
  listAll(organizationId: OrganizationId): Promise<readonly Threat[]>;
  listByType(organizationId: OrganizationId, threatType: Threat['threatType']): Promise<readonly Threat[]>;
}

/** Creates a real {@link ThreatDetectionEngine} backed by a {@link ThreatRepository}. */
export function createThreatDetectionEngine(
  repository: ThreatRepository,
  eventBus?: SecurityEventBus,
  now: () => string = nowIso,
): ThreatDetectionEngine {
  async function record(organizationId: OrganizationId, threatType: Threat['threatType'], severity: ThreatSeverity, details: string, sourceIdentityId?: string): Promise<Threat> {
    const threat: Threat = {
      id: generateId('threat'),
      organizationId,
      threatType,
      severity,
      details,
      sourceIdentityId,
      detectedAt: now(),
    };
    await repository.save(threat);
    return threat;
  }

  return {
    async scanPrompt(organizationId, input) {
      const detected: Threat[] = [];

      if (detectPromptInjection(input.text)) {
        const threat = await record(organizationId, 'prompt_injection', 'high', 'Prompt injection pattern detected', input.sourceIdentityId);
        detected.push(threat);
        eventBus?.publish('prompt.attack.detected', { organizationId, threatId: threat.id, threatType: threat.threatType });
      }
      if (detectJailbreak(input.text)) {
        const threat = await record(organizationId, 'jailbreak', 'high', 'Jailbreak attempt pattern detected', input.sourceIdentityId);
        detected.push(threat);
        eventBus?.publish('prompt.attack.detected', { organizationId, threatId: threat.id, threatType: threat.threatType });
      }
      if (detectSecretLeakage(input.text)) {
        const threat = await record(organizationId, 'secret_leakage', 'critical', 'Secret-shaped string detected in prompt', input.sourceIdentityId);
        detected.push(threat);
        eventBus?.publish('prompt.attack.detected', { organizationId, threatId: threat.id, threatType: threat.threatType });
      }

      return detected;
    },

    async checkToolAbuse(organizationId, input) {
      const abusiveToolIds = detectToolAbuse(input.executionCounts, input.maxExecutions);
      if (!abusiveToolIds.includes(input.toolId)) return null;
      return record(organizationId, 'tool_abuse', 'medium', `Tool "${input.toolId}" exceeded ${input.maxExecutions} executions`, input.sourceIdentityId);
    },

    async checkRateAbuse(organizationId, input) {
      const asOf = input.asOf ?? now();
      if (!detectRateAbuse(input.timestamps, input.windowMs, input.maxRequests, asOf)) return null;
      return record(organizationId, 'rate_abuse', 'medium', `More than ${input.maxRequests} requests within ${input.windowMs}ms`, input.sourceIdentityId);
    },

    async getThreat(organizationId, threatId) {
      return repository.findById(organizationId, threatId);
    },

    async listAll(organizationId) {
      return repository.findAll(organizationId);
    },

    async listByType(organizationId, threatType) {
      return repository.findByType(organizationId, threatType);
    },
  };
}
