/** @module prompt-security/types */

export interface PromptValidationResult {
  readonly valid: boolean;
  readonly violations: readonly string[];
}
