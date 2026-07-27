/**
 * Secrets — Secret Store, Secret Rotation, Provider Credentials, and
 * Encryption Keys, backed by real AES-256-GCM.
 * @module secrets
 */
export * from './types.js';
export * from './repository.js';
export { createSecretRepository } from './repository.impl.js';
export { createSecretsService, type SecretsService, type CreateSecretInput, type RotateSecretInput } from './service.impl.js';
export { generateEncryptionKey } from '../shared/crypto.js';
