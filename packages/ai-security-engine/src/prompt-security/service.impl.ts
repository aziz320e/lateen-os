/**
 * Real Prompt Security service — Prompt validation, sanitization, real
 * HMAC-SHA256 signatures, and prompt audit (composing the shared Audit
 * service — never a separate, duplicated audit sink).
 *
 * @module prompt-security/service.impl
 */
import type { AuditEvent, AuditService } from '../audit/index.js';
import { signHmac, verifyHmac } from '../shared/crypto.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { PromptValidationResult } from './types.js';

const DEFAULT_MAX_LENGTH = 8000;

/** Matches C0 control characters other than tab, newline, and carriage return, plus DEL. */
function containsControlCharacters(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    const isTabNewlineOrCr = code === 9 || code === 10 || code === 13;
    const isControl = (code >= 0 && code <= 31 && !isTabNewlineOrCr) || code === 127;
    if (isControl) return true;
  }
  return false;
}

function stripControlCharacters(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    const isTabNewlineOrCr = code === 9 || code === 10 || code === 13;
    const isControl = (code >= 0 && code <= 31 && !isTabNewlineOrCr) || code === 127;
    if (!isControl) result += text[i];
  }
  return result;
}

export interface AuditPromptInput {
  readonly prompt: string;
  readonly identityId?: string;
  readonly outcome: 'success' | 'failure' | 'blocked';
}

export interface PromptSecurityService {
  /** Pure: length and control-character checks. */
  validatePrompt(prompt: string, maxLength?: number): PromptValidationResult;
  /** Pure: strips control characters and collapses excessive whitespace. */
  sanitizePrompt(prompt: string): string;
  /** Real HMAC-SHA256 signature over the prompt text. */
  signPrompt(prompt: string, signingKey: string): string;
  /** Real, timing-safe HMAC-SHA256 signature verification. */
  verifyPromptSignature(prompt: string, signature: string, signingKey: string): boolean;
  /** Records a prompt-security audit entry via the shared Audit service. */
  auditPrompt(organizationId: OrganizationId, input: AuditPromptInput): Promise<AuditEvent>;
}

/** Creates a real {@link PromptSecurityService} over the shared Audit service. */
export function createPromptSecurityService(audit: Pick<AuditService, 'record'>): PromptSecurityService {
  return {
    validatePrompt(prompt, maxLength = DEFAULT_MAX_LENGTH) {
      const violations: string[] = [];
      if (prompt.length === 0) violations.push('empty_prompt');
      if (prompt.length > maxLength) violations.push('max_length_exceeded');
      if (containsControlCharacters(prompt)) violations.push('control_characters');
      return { valid: violations.length === 0, violations };
    },

    sanitizePrompt(prompt) {
      return stripControlCharacters(prompt).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    },

    signPrompt(prompt, signingKey) {
      return signHmac(prompt, signingKey);
    },

    verifyPromptSignature(prompt, signature, signingKey) {
      return verifyHmac(prompt, signature, signingKey);
    },

    async auditPrompt(organizationId, input) {
      return audit.record(organizationId, {
        category: 'prompt',
        action: 'prompt_submitted',
        actorId: input.identityId,
        outcome: input.outcome,
        details: { length: input.prompt.length },
      });
    },
  };
}
