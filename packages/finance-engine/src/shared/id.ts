/** Dependency-free id/timestamp helpers shared by every Finance Engine implementation. @module shared/id */

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
